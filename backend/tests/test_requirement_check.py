"""Requirement Analysis self-check: finding problems against the RFQ text, the focused
re-read (fake LLM), and range quantities being sent to the customer."""
import json

import pytest

from app.agents import requirement_check as rc
from app.agents.state import AgentState
from app.llm.client import LLMUnavailableError, llm_client

RFQ = ("Please quote Industrial Valve IV-200, 20 units, and Flange Plate FP-50, 250 units. "
       "Payment: Net 30 days. Delivery ex-works Pune.")
GOOD = {"line_items": [{"product_name": "Industrial Valve", "product_code": "IV-200", "quantity": 20},
                       {"product_name": "Flange Plate", "product_code": "FP-50", "quantity": 250}],
        "payment_terms": "Net 30 days", "delivery_terms": "ex-works Pune"}


def kinds(problems):
    return sorted(p["kind"] for p in problems)


def state(reqs, text=RFQ):
    return AgentState(rfq_id="t", raw_text=text, extracted_requirements=json.loads(json.dumps(reqs)))


# ---- finding problems ------------------------------------------------------------

def test_correct_extraction_has_no_problems():
    assert rc.find_problems(GOOD, RFQ) == []


def test_invented_quantity_is_caught():
    bad = json.loads(json.dumps(GOOD))
    bad["line_items"][0]["quantity"] = 25
    assert kinds(rc.find_problems(bad, RFQ)) == ["quantity"]


def test_quantity_taken_from_a_range_is_caught():
    text = "Need pressure relief valves PV-100, around 30 to 40 pieces. Net 30. Ex-works Pune."
    reqs = {"line_items": [{"product_name": "Pressure Relief Valve", "product_code": "PV-100", "quantity": 40}],
            "payment_terms": "Net 30", "delivery_terms": "Ex-works Pune"}
    assert kinds(rc.find_problems(reqs, text)) == ["range"]


def test_dropped_line_item_and_terms_are_caught():
    partial = {"line_items": [GOOD["line_items"][0]], "payment_terms": None, "delivery_terms": None}
    assert kinds(rc.find_problems(partial, RFQ)) == ["missed_item", "missed_terms", "missed_terms"]


def test_product_codes_are_not_mistaken_for_quantities():
    # "IV-200" contains 200, but the customer asked for 20
    reqs = {"line_items": [{"product_code": "IV-200", "quantity": 200}]}
    assert "quantity" in kinds(rc.find_problems(reqs, "Need IV-200 x 20 units"))


# ---- re-reading -------------------------------------------------------------------

@pytest.fixture
def llm(monkeypatch):
    calls = []

    def use(replies):
        monkeypatch.setattr(llm_client, "demo_mode", False)
        it = iter(replies)

        def reply(system_prompt, user_prompt):
            calls.append(user_prompt)
            nxt = next(it)
            if isinstance(nxt, Exception):
                raise nxt
            return json.dumps(nxt)
        monkeypatch.setattr(llm_client, "generate_completion", reply)
        return calls
    return use


def test_reread_fixes_a_dropped_item(llm):
    calls = llm([GOOD])
    s = rc.self_check(state({"line_items": [GOOD["line_items"][0]], **{k: GOOD[k] for k in ("payment_terms", "delivery_terms")}}))
    assert [i["product_code"] for i in s.extracted_requirements["line_items"]] == ["IV-200", "FP-50"]
    assert len(calls) == 1 and "FP-50" in calls[0]          # the prompt names the problem
    assert any(m["type"] == "self-check" and "re-read 1" in m["content"] for m in s.messages)


def test_a_reread_that_does_not_help_is_not_kept(llm):
    worse = {"line_items": [], "payment_terms": None, "delivery_terms": None}
    calls = llm([worse])
    start = {"line_items": [GOOD["line_items"][0]], "payment_terms": "Net 30 days", "delivery_terms": "ex-works Pune"}
    s = rc.self_check(state(start))
    assert len(calls) == 1                                   # stops after a useless re-read
    assert [i["product_code"] for i in s.extracted_requirements["line_items"]] == ["IV-200"]
    assert any("self-check:" in n for n in s.extracted_requirements["normalization_notes"])


def test_llm_down_keeps_the_first_extraction(llm):
    llm([LLMUnavailableError("provider down")])
    start = {"line_items": [GOOD["line_items"][0]], "payment_terms": "Net 30 days", "delivery_terms": "ex-works Pune"}
    s = rc.self_check(state(start))
    assert len(s.extracted_requirements["line_items"]) == 1


def test_range_quantity_goes_to_the_customer_without_a_reread(llm):
    calls = llm([])
    text = "Need pressure relief valves PV-100, around 30 to 40 pieces. Net 30. Ex-works Pune."
    reqs = {"line_items": [{"product_name": "Pressure Relief Valve", "product_code": "PV-100", "quantity": 40}],
            "payment_terms": "Net 30", "delivery_terms": "Ex-works Pune"}
    s = rc.self_check(state(reqs, text))
    assert calls == []
    assert s.extracted_requirements["line_items"][0]["quantity"] is None
    assert s.extracted_requirements["normalization_notes"] == [
        "Pressure Relief Valve: quantity given as a range (30 to 40)"]


def test_clean_extraction_makes_no_llm_call(llm):
    calls = llm([])
    s = rc.self_check(state(GOOD))
    assert calls == [] and s.messages[-1]["content"] == "extraction matches the RFQ text"
