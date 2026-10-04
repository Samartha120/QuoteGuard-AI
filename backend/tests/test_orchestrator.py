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


def vp(conf, decision=None, issues=None):
    """Fake Validation & Planning agent: scores every line at `conf` and decides."""
    def fn(s):
        names = [i["product_name"] for i in s.extracted_requirements["line_items"]]
        s.field_confidences = {n: conf for n in names}
        d = decision or ("proceed" if conf >= settings.GROUNDING_THRESHOLD else "clarify")
        s.abstention_required = d != "proceed"
        s.grounded_status = "ABSTAINED" if s.abstention_required else "GROUNDED"
        s.validation_plan = {"decision": d, "issues": issues or []}
        return _trace(s, "validation_planning")
    return fn


def drafting(s):
    s.quotation_draft = {"status": "PENDING_APPROVAL", "line_items": []}
    return _trace(s, "drafting")


def critic(verdict="approve", fix_by=None):
    def fn(s):
        prev = s.critic_feedback
        s.critic_feedback = {"verdict": verdict, "fix_by": fix_by or [], "round": prev.get("round", 0) + 1,
                             "issues": [{"line": "IV-200", "detail": "fake issue", "severity": "error",
                                         "fix_by": f} for f in (fix_by or [])],
                             "unchanged_since_last_round": False}
        return _trace(s, "critic")
    return fn


def agents(**overrides):
    base = {"extraction": extraction([ITEM_OK]), "retrieval": retrieval,
            "validation_planning": vp(0.95), "drafting": drafting,
            "critic": critic()}
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
    assert route(s) == ["extraction", "retrieval", "validation_planning", "drafting", "critic", FINISH]
    assert all(d["decided_by"] == "forced" for d in s.orchestrator_decisions)
    assert s.quotation_draft["status"] == "PENDING_APPROVAL"


def test_every_handoff_is_a_message():
    s = run(new_state(), agents())
    tasks = [m["to"] for m in s.messages if m["type"] == "task"]
    results = [m["from"] for m in s.messages if m["type"] == "result"]
    assert tasks == results == ["extraction", "retrieval", "validation_planning", "drafting", "critic"]


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
    s = run(new_state(), agents(validation_planning=vp(0.55)))
    r = route(s)
    assert r[:4] == ["extraction", "retrieval", "validation_planning", "retrieval"]
    # validation & planning re-runs on the new evidence, then the retry budget forces drafting
    assert r[4:] == ["validation_planning", "drafting", "critic", FINISH]


def test_unstocked_grade_skips_re_search():
    s = run(new_state(), agents(extraction=extraction([ITEM_SS316]), validation_planning=vp(0.40)))
    assert route(s) == ["extraction", "retrieval", "validation_planning", "drafting", "critic", FINISH]
    drafting_decision = s.orchestrator_decisions[3]
    assert "not stocked" in drafting_decision["reason"]


def _fake_llm(monkeypatch, reply):
    monkeypatch.setattr(settings, "ORCHESTRATOR_USE_LLM", True)
    monkeypatch.setattr(llm_client, "demo_mode", False)
    monkeypatch.setattr(llm_client, "generate_completion", lambda **kw: reply)


def test_llm_choice_is_used_when_legal(monkeypatch):
    _fake_llm(monkeypatch, '{"next": "drafting", "reason": "evidence is adequate"}')
    s = run(new_state(), agents(validation_planning=vp(0.55)))
    branch = s.orchestrator_decisions[3]
    assert branch["decided_by"] == "llm"
    assert branch["next"] == "drafting"
    assert branch["reason"] == "evidence is adequate"


def test_illegal_llm_choice_falls_back_to_policy(monkeypatch):
    _fake_llm(monkeypatch, '{"next": "critic", "reason": "skip ahead"}')
    s = run(new_state(), agents(validation_planning=vp(0.55)))
    branch = s.orchestrator_decisions[3]
    assert branch["decided_by"] == "policy"
    assert branch["next"] == "retrieval"


def test_legal_moves_never_allow_drafting_first():
    moves = [m for m, _ in orchestrator.legal_moves(new_state())]
    assert moves == ["extraction"]


# ---- critic loop --------------------------------------------------------------

def scripted_critic(*rounds):
    """Critic that returns the given (verdict, fix_by, unchanged) per round, last one repeating."""
    calls = {"n": 0}

    def fn(s):
        verdict, fix_by, unchanged = rounds[min(calls["n"], len(rounds) - 1)]
        calls["n"] += 1
        s = critic(verdict, fix_by)(s)
        s.critic_feedback["unchanged_since_last_round"] = unchanged
        return s
    return fn


def test_revision_goes_back_to_drafting_with_the_critics_findings():
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["drafting"], False),
                                                       ("approve", [], False))))
    assert route(s)[4:] == ["critic", "drafting", "critic", FINISH]
    task = [m for m in s.messages if m["type"] == "task" and m["to"] == "drafting"][-1]
    assert "fake issue" in task["content"]


def test_revision_that_changes_nothing_is_escalated():
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["drafting"], False),
                                                       ("revise", ["drafting"], True))))
    assert route(s)[-3:] == ["drafting", "critic", ESCALATE]
    assert "changed nothing" in s.escalation_notes
    assert s.quotation_draft["status"] == "CLARIFICATION_REQUIRED"


def test_missing_evidence_sends_retrieval_out_and_reruns_downstream():
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["retrieval"], False),
                                                       ("approve", [], False))))
    assert route(s)[4:] == ["critic", "retrieval", "validation_planning", "drafting", "critic", FINISH]


def test_problem_only_a_human_can_decide_is_escalated_at_once():
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["human"], False))))
    assert route(s)[-2:] == ["critic", ESCALATE]
    assert s.grounded_status == "ABSTAINED"


def test_revision_budget_is_enforced():
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["drafting"], False))))
    assert route(s).count("drafting") == 1 + orchestrator.MAX_REVISIONS
    assert route(s)[-1] == ESCALATE
    assert "budget" in s.escalation_notes


def test_llm_choosing_escalate_still_records_the_findings(monkeypatch):
    _fake_llm(monkeypatch, '{"next": "escalate", "reason": "needs a commercial decision"}')
    s = run(new_state(), agents(critic=scripted_critic(("revise", ["drafting"], False))))
    branch = s.orchestrator_decisions[-1]
    assert branch["decided_by"] == "llm" and branch["next"] == ESCALATE
    assert "fake issue" in s.escalation_notes


# ---- Validation & Planning decision -------------------------------------------

def test_escalate_decision_still_gets_a_draft_then_goes_to_a_human():
    internal = [{"item": "payment terms", "kind": "conflicting", "resolver": "internal",
                 "detail": "customer asks for 90-day credit"}]
    s = run(new_state(), agents(validation_planning=vp(0.95, "escalate", internal)))
    assert route(s) == ["extraction", "retrieval", "validation_planning", "drafting", "critic", ESCALATE]
    assert "90-day credit" in s.escalation_notes
    assert s.quotation_draft["status"] == "CLARIFICATION_REQUIRED"


def test_clarify_decision_drafts_a_clarification_and_finishes():
    customer = [{"item": "IV-200", "kind": "ambiguous", "resolver": "customer", "detail": "size not given"}]
    s = run(new_state(), agents(validation_planning=vp(0.95, "clarify", customer)))
    assert route(s)[-1] == FINISH
    task = [m for m in s.messages if m["type"] == "task" and m["to"] == "drafting"][0]
    assert "clarify" in task["content"] and "size not given" in task["content"]
