"""Per-agent metrics on hand-built finished runs."""
from app.agents.state import AgentState
from app.services.agent_metrics import effective_decision, score_case, summarize


def finished(decision=None, issues=(), items=2, prices=None, verdict="approve", rounds=1, escalated=False):
    s = AgentState(rfq_id="t", raw_text="x")
    s.extracted_requirements = {"line_items": [{"product_name": f"p{i}"} for i in range(items)]}
    if decision:
        s.validation_plan = {"decision": decision, "issues": list(issues)}
    if escalated:
        s.orchestrator_decisions = [{"next": "extraction"}, {"next": "escalate"}]
    s.quotation_draft = {"line_items": [{"product_code": c, "unit_price": p} for c, p in (prices or {}).items()]}
    s.critic_feedback = {"verdict": verdict, "round": rounds}
    return s


def test_clean_case_scores_on_every_agent():
    case = {"eval_id": "e1", "expected_decision": "proceed", "expected_line_items": 2,
            "expected_unit_prices": {"IV-200": 4275.0, "FP-50": 765.0}}
    sc = score_case(case, finished("proceed", prices={"IV-200": 4275.0, "FP-50": 765.0}))
    assert sc["decision_ok"] and sc["extraction_items_ok"] and sc["prices_ok"]
    assert sc["false_alarm"] is False and sc["critic_verdict"] == "approve"


def test_wrong_price_and_false_alarm_are_counted():
    case = {"expected_decision": "proceed", "expected_unit_prices": {"IV-200": 4275.0}}
    sc = score_case(case, finished("clarify", issues=[{"x": 1}], prices={"IV-200": 4500.0}))
    assert sc["decision_ok"] is False and sc["false_alarm"] is True and sc["prices_ok"] is False


def test_known_gap_must_be_detected():
    case = {"expected_decision": "clarify", "unsupported_fields": ["FP-50.below_moq"]}
    assert score_case(case, finished("clarify", issues=[{"x": 1}]))["gap_detected"] is True
    assert score_case(case, finished("proceed"))["gap_detected"] is False


def test_early_escalation_counts_as_escalate():
    s = finished(escalated=True, items=0)
    assert effective_decision(s) == "escalate"
    assert score_case({"expected_decision": "escalate", "expected_line_items": 0}, s)["decision_ok"]


def test_summary_rates_skip_cases_without_an_expectation():
    scores = [{"decision_ok": True, "critic_verdict": "approve", "critic_rounds": 1},
              {"decision_ok": False, "critic_verdict": "revise", "critic_rounds": 3},
              {"prices_ok": True}]
    out = summarize(scores)
    assert out["validation_planning"]["decision_accuracy_pct"] == 50.0
    assert out["quotation"]["price_accuracy_pct"] == 100.0
    assert out["critic"] == {"final_approval_pct": 50.0, "avg_review_rounds": 2.0, "cases": 2}
    assert out["requirement_analysis"]["item_accuracy_pct"] is None
