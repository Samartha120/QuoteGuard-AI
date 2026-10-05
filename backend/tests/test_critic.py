"""Critic agent tests. The rule layer is checked against the real approved pricing CSV
(IV-200 = INR 4500, 5% off from 50 units, MoQ 5); the LLM layer uses a fake client
so the safeguards on LLM findings can be tested deterministically."""
import json

import pytest

from app.agents import critic_agent as critic
from app.agents.critic_agent import check_draft, run_critic_agent
from app.agents.state import AgentState
from app.llm.client import llm_client

EVIDENCE = [{"chunk_id": "c-price", "content": "IV-200 INR 4500", "metadata": {"doc_type": "pricing"}},
            {"chunk_id": "c-policy", "content": "Standard Credit Period: Net 30 Days from date of invoice.",
             "metadata": {"doc_type": "policy"}}]
RFQ = "Need Industrial Valve IV-200 x 20 units. Payment: 90 days credit. Delivery to Surat in 3 days."


def priced_line(qty=20, unit=4500.0, chunk="c-price", **kw):
    line = {"product_code": "IV-200", "product_name": "Industrial Valve IV-200", "material_grade": "SS304",
            "quantity": qty, "unit_price": unit, "total_price": round(unit * qty, 2), "status": "verified",
            "citations": [{"source_chunk_id": chunk}]}
    return {**line, **kw}


def make_state(lines, qty=20, abstain=False, questions=None, status=None):
    subtotal = sum(l["total_price"] or 0 for l in lines if l["status"] == "verified")
    tax = round(subtotal * 0.18, 2)
    return AgentState(
        rfq_id="t", raw_text=RFQ,
        extracted_requirements={"line_items": [{"product_name": "Industrial Valve IV-200",
                                                "product_code": "IV-200", "quantity": qty}]},
        retrieved_evidence=EVIDENCE,
        abstention_required=abstain,
        clarification_questions=questions or [],
        quotation_draft={"status": status or ("CLARIFICATION_REQUIRED" if abstain else "PENDING_APPROVAL"),
                         "line_items": lines, "subtotal": subtotal, "tax_amount": tax,
                         "total_amount": round(subtotal + tax, 2)},
    )


def checks(state):
    return {i["check"] for i in check_draft(state)}


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(llm_client, "demo_mode", True)


# ---- rule layer -------------------------------------------------------------

def test_correct_draft_passes_every_rule():
    assert check_draft(make_state([priced_line()])) == []


def test_wrong_price_is_caught():
    assert "unit_price" in checks(make_state([priced_line(unit=4200.0)]))


def test_bulk_discount_must_be_applied():
    # 60 units crosses the 50-unit threshold, so 4500 is wrong; 4275 (5% off) is right
    assert "unit_price" in checks(make_state([priced_line(qty=60, unit=4500.0)], qty=60))
    assert check_draft(make_state([priced_line(qty=60, unit=4275.0)], qty=60)) == []


def test_quantity_must_match_rfq():
    assert "quantity" in checks(make_state([priced_line(qty=25)], qty=20))


def test_missing_item_is_caught():
    assert "coverage" in checks(make_state([]))


def test_invented_citation_is_sent_to_retrieval():
    issues = check_draft(make_state([priced_line(chunk="chunk_default_01")]))
    cite = [i for i in issues if i["check"] == "citation"]
    assert cite and cite[0]["fix_by"] == "retrieval"


def test_totals_must_include_gst():
    state = make_state([priced_line()])
    state.quotation_draft["tax_amount"] = 0.0
    assert "tax_amount" in checks(state)


def test_abstained_line_must_not_carry_a_price():
    line = priced_line(status="abstained")
    assert "abstained_has_price" in checks(make_state([line], abstain=True, questions=["Confirm grade?"]))


def test_abstention_needs_a_question_for_the_customer():
    line = priced_line(status="abstained", unit_price=None, total_price=None)
    assert "clarification" in checks(make_state([line], abstain=True))


def test_below_moq_is_only_a_warning():
    issues = check_draft(make_state([priced_line(qty=2)], qty=2))
    moq = [i for i in issues if i["check"] == "moq"]
    assert moq and moq[0]["severity"] == "warning"


def test_verdict_without_llm():
    ok = run_critic_agent(make_state([priced_line()]))
    bad = run_critic_agent(make_state([priced_line(unit=1.0)]))
    assert ok.critic_feedback["verdict"] == "approve" and ok.critic_feedback["reviewed_by"] == ["rules"]
    assert bad.critic_feedback["verdict"] == "revise" and bad.critic_feedback["fix_by"] == ["drafting"]
    assert bad.agent_traces[-1]["agent_name"] == "Critic Agent"


def test_rounds_are_counted():
    s = run_critic_agent(make_state([priced_line()]))
    assert run_critic_agent(s).critic_feedback["round"] == 2


# ---- LLM layer --------------------------------------------------------------

def fake_llm(monkeypatch, review, confirms=True):
    """First call is the review; later calls are conflict confirmations."""
    monkeypatch.setattr(llm_client, "demo_mode", False)

    def reply(system_prompt, user_prompt):
        if "breaks_policy" in user_prompt:
            return json.dumps({"breaks_policy": confirms, "why": "-"})
        return review if isinstance(review, str) else json.dumps(review)

    monkeypatch.setattr(llm_client, "generate_completion", reply)


CREDIT = {"line": "terms", "detail": "Customer wants 90 days credit but policy allows Net 30",
          "rfq_quote": "Payment: 90 days credit", "policy_quote": "Net 30 Days from date of invoice",
          "severity": "error", "fix_by": "drafting"}


def test_verified_llm_error_forces_revision(monkeypatch):
    fake_llm(monkeypatch, {"issues": [CREDIT], "summary": "credit conflict"})
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["verdict"] == "revise"
    assert fb["reviewed_by"] == ["rules", "llm"]


def test_llm_error_with_invented_quote_is_downgraded(monkeypatch):
    fake_llm(monkeypatch, {"issues": [{**CREDIT, "policy_quote": "Credit is never allowed"}]})
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["verdict"] == "approve"
    assert "quotes not found" in fb["issues"][0]["downgraded"]


def test_llm_error_already_asked_is_downgraded(monkeypatch):
    fake_llm(monkeypatch, {"issues": [CREDIT]})
    asked = ["Customer requested 90-day credit terms. Policy caps credit at Net 30 Days."]
    fb = run_critic_agent(make_state([priced_line()], questions=asked)).critic_feedback
    assert fb["verdict"] == "approve"
    assert fb["issues"][0]["downgraded"] == "already raised in a clarification question"


def test_llm_error_that_fails_second_check_is_downgraded(monkeypatch):
    fake_llm(monkeypatch, {"issues": [CREDIT]}, confirms=False)
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["verdict"] == "approve"
    assert "second check" in fb["issues"][0]["downgraded"]


def test_llm_cannot_clear_a_rule_failure(monkeypatch):
    fake_llm(monkeypatch, {"issues": [], "summary": "looks fine"})
    fb = run_critic_agent(make_state([priced_line(unit=1.0)])).critic_feedback
    assert fb["verdict"] == "revise"


def test_truncated_llm_json_is_repaired(monkeypatch):
    truncated = json.dumps({"issues": [CREDIT], "summary": "x"})[:-1]  # drop the final brace
    fake_llm(monkeypatch, truncated)
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["reviewed_by"] == ["rules", "llm"] and fb["verdict"] == "revise"


def test_unusable_llm_reply_falls_back_to_rules(monkeypatch):
    fake_llm(monkeypatch, "I'm happy to help! The quote looks great.")
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["reviewed_by"] == ["rules"] and fb["verdict"] == "approve"


def test_quote_matching_ignores_case_and_punctuation():
    assert critic.quote_found("net 30 days, from date of invoice", "Net 30 Days from date of invoice.")
    assert not critic.quote_found("Net 60 Days", "Net 30 Days from date of invoice.")


def test_llm_outage_falls_back_to_rules(monkeypatch):
    from app.llm.client import LLMUnavailableError
    monkeypatch.setattr(llm_client, "demo_mode", False)

    def down(**kw):
        raise LLMUnavailableError("provider down")
    monkeypatch.setattr(llm_client, "generate_completion", down)
    fb = run_critic_agent(make_state([priced_line()])).critic_feedback
    assert fb["reviewed_by"] == ["rules"] and fb["verdict"] == "approve"
