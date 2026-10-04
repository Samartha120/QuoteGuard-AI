"""Validation & Planning agent: rule checks against the real approved pricing CSV
(IV-200 SS304, MoQ 5), the decision rule, and the safeguards on LLM findings."""
import json

import pytest

from app.agents import validation_planning_agent as vpa
from app.agents.state import AgentState
from app.llm.client import llm_client

RFQ = ("Please quote Industrial Valve IV-200, 20 units, PN16 rating. "
       "Payment: Net 30 days. Delivery: ex-works Pune is fine.")
EVIDENCE = [{"chunk_id": "c1", "score": 0.95, "content": "Industrial Valve IV-200 SS304 PN16 INR 4500",
             "metadata": {"doc_type": "catalog"}},
            {"chunk_id": "c2", "score": 0.9, "content": "Standard Delivery: Ex-works Pune factory warehouse.",
             "metadata": {"doc_type": "policy"}}]


def item(**kw):
    base = {"product_name": "Industrial Valve IV-200", "product_code": "IV-200",
            "material_grade": "SS304", "quantity": 20}
    return {**base, **kw}


def make_state(items=None, payment="Net 30 days", raw=RFQ):
    return AgentState(rfq_id="t", raw_text=raw, retrieved_evidence=EVIDENCE,
                      extracted_requirements={"line_items": items if items is not None else [item()],
                                              "payment_terms": payment})


def kinds(issues):
    return {(i["kind"], i["resolver"]) for i in issues}


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(llm_client, "demo_mode", True)


# ---- rules ----------------------------------------------------------------

def test_clean_rfq_proceeds():
    s = vpa.run_validation_planning_agent(make_state())
    assert s.validation_plan["decision"] == "proceed"
    assert s.validation_plan["issues"] == []
    assert s.grounded_status == "GROUNDED" and not s.abstention_required


def test_unstocked_grade_is_for_the_customer():
    s = vpa.run_validation_planning_agent(make_state([item(material_grade="SS316")]))
    assert ("conflicting", "customer") in kinds(s.validation_plan["issues"])
    assert s.validation_plan["decision"] == "clarify"
    assert s.grounded_status == "ABSTAINED"


def test_missing_quantity_and_below_moq_go_to_the_customer():
    assert ("missing", "customer") in kinds(vpa.rule_issues(make_state([item(quantity=None)])))
    moq = vpa.rule_issues(make_state([item(quantity=2)]))
    assert any("minimum order" in i["detail"] for i in moq)


def test_unknown_product_needs_an_internal_decision():
    s = vpa.run_validation_planning_agent(make_state([item(product_code="XX-999", product_name="Gate Valve GV-9")]))
    assert ("missing", "internal") in kinds(s.validation_plan["issues"])
    assert s.validation_plan["decision"] == "escalate"


def test_credit_beyond_policy_needs_finance():
    s = vpa.run_validation_planning_agent(make_state(payment="90 Days post-installation credit"))
    assert any("90-day credit" in i["detail"] and i["resolver"] == "internal" for i in s.validation_plan["issues"])
    assert s.validation_plan["decision"] == "escalate"


@pytest.mark.parametrize("terms,days", [("Net 45", 45), ("90 days post-installation", 90),
                                        ("30-day credit", 30), ("advance payment", None), (None, None)])
def test_credit_days_parsing(terms, days):
    assert vpa.credit_days(terms) == days


def test_replaces_planning_and_validation_traces_with_one():
    s = vpa.run_validation_planning_agent(make_state())
    assert [t["agent_name"] for t in s.agent_traces] == ["Validation & Planning Agent"]


def test_decision_rule():
    assert vpa.decide([]) == "proceed"
    assert vpa.decide([{"resolver": "customer"}]) == "clarify"
    assert vpa.decide([{"resolver": "customer"}, {"resolver": "internal"}]) == "escalate"


# ---- LLM review -------------------------------------------------------------

def fake_llm(monkeypatch, issues):
    monkeypatch.setattr(llm_client, "demo_mode", False)
    monkeypatch.setattr(llm_client, "generate_completion",
                        lambda system_prompt, user_prompt: json.dumps({"issues": issues}))


VAGUE = {"item": "IV-200", "kind": "ambiguous", "detail": "end connection type not specified",
         "rfq_quote": "Industrial Valve IV-200, 20 units", "resolver": "customer"}


def test_verified_llm_finding_is_used(monkeypatch):
    fake_llm(monkeypatch, [VAGUE])
    s = vpa.run_validation_planning_agent(make_state())
    assert s.validation_plan["reviewed_by"] == ["rules", "llm"]
    assert s.validation_plan["decision"] == "clarify"


def test_llm_finding_with_invented_rfq_quote_is_dropped(monkeypatch):
    fake_llm(monkeypatch, [{**VAGUE, "rfq_quote": "customer needs flanged ends"}])
    s = vpa.run_validation_planning_agent(make_state())
    assert s.validation_plan["decision"] == "proceed"


def test_llm_conflict_needs_real_evidence(monkeypatch):
    conflict = {"item": "delivery", "kind": "conflicting", "resolver": "internal",
                "detail": "delivery clashes with policy", "rfq_quote": "ex-works Pune is fine",
                "evidence_quote": "free doorstep delivery everywhere"}
    fake_llm(monkeypatch, [conflict])
    assert vpa.run_validation_planning_agent(make_state()).validation_plan["decision"] == "proceed"


def test_unusable_llm_reply_falls_back_to_rules(monkeypatch):
    monkeypatch.setattr(llm_client, "demo_mode", False)
    monkeypatch.setattr(llm_client, "generate_completion", lambda **kw: "Sure! Looks good to me.")
    s = vpa.run_validation_planning_agent(make_state())
    assert s.validation_plan["reviewed_by"] == ["rules"]


def test_loosely_named_product_is_confirmed_with_the_customer():
    s = vpa.run_validation_planning_agent(make_state([item(product_code=None, product_name="Pressure Relief Valves")]))
    issue = s.validation_plan["issues"][0]
    assert (issue["kind"], issue["resolver"]) == ("ambiguous", "customer") and "PV-100" in issue["detail"]
    assert s.validation_plan["decision"] == "clarify"


def test_ambiguity_rejected_by_second_check_is_dropped(monkeypatch):
    monkeypatch.setattr(llm_client, "demo_mode", False)

    def reply(system_prompt, user_prompt):
        if "must_ask_customer" in user_prompt:
            return json.dumps({"must_ask_customer": False, "why": "product and quantity are given"})
        return json.dumps({"issues": [VAGUE]})
    monkeypatch.setattr(llm_client, "generate_completion", reply)
    assert vpa.run_validation_planning_agent(make_state()).validation_plan["decision"] == "proceed"


def test_conflict_rejected_by_second_check_is_dropped(monkeypatch):
    monkeypatch.setattr(llm_client, "demo_mode", False)
    conflict = {"item": "delivery", "kind": "conflicting", "resolver": "internal",
                "detail": "ex-works conflicts with policy", "rfq_quote": "ex-works Pune is fine",
                "evidence_quote": "Standard Delivery: Ex-works Pune factory warehouse"}

    def reply(system_prompt, user_prompt):
        if "breaks_policy" in user_prompt:
            return json.dumps({"breaks_policy": False, "why": "same terms"})
        return json.dumps({"issues": [conflict]})
    monkeypatch.setattr(llm_client, "generate_completion", reply)
    assert vpa.run_validation_planning_agent(make_state()).validation_plan["decision"] == "proceed"


def test_llm_repeat_of_a_rule_finding_is_dropped(monkeypatch):
    repeat = {"item": "Industrial Valve IV-200", "kind": "ambiguous", "resolver": "customer",
              "detail": "requested grade SS316 is not stocked in the approved grades",
              "rfq_quote": "Industrial Valve IV-200, 20 units"}
    fake_llm(monkeypatch, [repeat])
    s = vpa.run_validation_planning_agent(make_state([item(material_grade="SS316")]))
    assert [i["source"] for i in s.validation_plan["issues"]] == ["rules"]
