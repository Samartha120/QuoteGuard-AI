"""Routing tests for the supervisor graph, using fake agents so they run without
the vector store or an LLM. They check that the route changes with what the
agents produce — the property a fixed pipeline does not have."""
import pytest

from app.agents import orchestrator
from app.agents.orchestrator import ESCALATE, FINISH, MAX_ATTEMPTS, run
from app.agents.state import AgentState
from app.core.config import settings
from app.llm.client import llm_client

ITEM_OK = {"product_name": "Industrial Valve IV-200", "product_code": "IV-200",
           "material_grade": "SS304", "quantity": 20}
ITEM_SS316 = {**ITEM_OK, "material_grade": "SS316"}


def _trace(state, name):
    state.agent_traces.append({"agent_name": name, "status": "SUCCESS",
                               "output_summary": f"{name} ok", "execution_time_ms": 0})
    return state


def extraction(items):
    def fn(s):
        s.extracted_requirements = {"line_items": [dict(i) for i in items]}
        return _trace(s, "extraction")
    return fn


def retrieval(s):
    s.retrieved_evidence = [{"chunk_id": "c1", "score": 0.9, "content": "IV-200 SS304"}]
    return _trace(s, "retrieval")


def planning(conf):
    def fn(s):
        names = [i["product_name"] for i in s.extracted_requirements["line_items"]]
        s.field_confidences = {n: conf for n in names}
        s.abstention_required = conf < settings.GROUNDING_THRESHOLD
        s.grounded_status = "ABSTAINED" if s.abstention_required else "GROUNDED"
        return _trace(s, "planning")
    return fn


def validation(s):
    return _trace(s, "validation")


def drafting(s):
    s.quotation_draft = {"status": "PENDING_APPROVAL", "line_items": []}
    return _trace(s, "drafting")


def agents(**overrides):
    base = {"extraction": extraction([ITEM_OK]), "retrieval": retrieval,
            "planning": planning(0.95), "validation": validation, "drafting": drafting}
    return {**base, **overrides}


def route(state):
    return [d["next"] for d in state.orchestrator_decisions]


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    """Tests are deterministic unless they opt in to a (fake) LLM."""
    monkeypatch.setattr(settings, "ORCHESTRATOR_USE_LLM", False)


def new_state():
    return AgentState(rfq_id="t", raw_text="rfq")


def test_clean_rfq_runs_each_agent_once():
    s = run(new_state(), agents())
    assert route(s) == ["extraction", "retrieval", "planning", "validation", "drafting", FINISH]
    assert all(d["decided_by"] == "forced" for d in s.orchestrator_decisions)
    assert s.quotation_draft["status"] == "PENDING_APPROVAL"


def test_every_handoff_is_a_message():
    s = run(new_state(), agents())
    tasks = [m["to"] for m in s.messages if m["type"] == "task"]
    results = [m["from"] for m in s.messages if m["type"] == "result"]
    assert tasks == results == ["extraction", "retrieval", "planning", "validation", "drafting"]


def test_failed_agent_is_retried_not_crashed():
    calls = {"n": 0}

    def flaky(s):
        calls["n"] += 1
        if calls["n"] == 1:
            raise TimeoutError("vector store timed out")
        return retrieval(s)

    s = run(new_state(), agents(retrieval=flaky))
    assert route(s)[:3] == ["extraction", "retrieval", "retrieval"]
    assert route(s)[-1] == FINISH
    assert any(m["type"] == "error" and "timed out" in m["content"] for m in s.messages)
    assert any(t["status"] == "FAILED" for t in s.agent_traces)


def test_agent_that_keeps_failing_is_escalated():
    def broken(s):
        raise RuntimeError("pricing service down")

    s = run(new_state(), agents(retrieval=broken))
    assert route(s).count("retrieval") == MAX_ATTEMPTS
    assert route(s)[-1] == ESCALATE
    assert s.grounded_status == "ABSTAINED"
    assert s.quotation_draft["status"] == "CLARIFICATION_REQUIRED"
    assert "failed" in s.escalation_notes


def test_empty_extraction_is_read_again():
    calls = {"n": 0}

    def first_empty(s):
        calls["n"] += 1
        return extraction([] if calls["n"] == 1 else [ITEM_OK])(s)

    s = run(new_state(), agents(extraction=first_empty))
    assert route(s)[:3] == ["extraction", "extraction", "retrieval"]
    assert route(s)[-1] == FINISH


def test_weak_evidence_on_stocked_item_triggers_one_re_search():
    s = run(new_state(), agents(planning=planning(0.55)))
    r = route(s)
    assert r[:4] == ["extraction", "retrieval", "planning", "retrieval"]
    # planning must re-run on the new evidence, then the retry budget forces validation
    assert r[4:] == ["planning", "validation", "drafting", FINISH]


def test_unstocked_grade_skips_re_search():
    s = run(new_state(), agents(extraction=extraction([ITEM_SS316]), planning=planning(0.40)))
    assert route(s) == ["extraction", "retrieval", "planning", "validation", "drafting", FINISH]
    validation_decision = s.orchestrator_decisions[3]
    assert "not stocked" in validation_decision["reason"]


def _fake_llm(monkeypatch, reply):
    monkeypatch.setattr(settings, "ORCHESTRATOR_USE_LLM", True)
    monkeypatch.setattr(llm_client, "demo_mode", False)
    monkeypatch.setattr(llm_client, "generate_completion", lambda **kw: reply)


def test_llm_choice_is_used_when_legal(monkeypatch):
    _fake_llm(monkeypatch, '{"next": "validation", "reason": "evidence is adequate"}')
    s = run(new_state(), agents(planning=planning(0.55)))
    branch = s.orchestrator_decisions[3]
    assert branch["decided_by"] == "llm"
    assert branch["next"] == "validation"
    assert branch["reason"] == "evidence is adequate"


def test_illegal_llm_choice_falls_back_to_policy(monkeypatch):
    _fake_llm(monkeypatch, '{"next": "drafting", "reason": "skip ahead"}')
    s = run(new_state(), agents(planning=planning(0.55)))
    branch = s.orchestrator_decisions[3]
    assert branch["decided_by"] == "policy"
    assert branch["next"] == "retrieval"


def test_legal_moves_never_allow_drafting_first():
    moves = [m for m, _ in orchestrator.legal_moves(new_state())]
    assert moves == ["extraction"]
