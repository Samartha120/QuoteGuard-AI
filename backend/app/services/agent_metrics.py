"""Per-agent evaluation metrics, as promised in the approved proposal.

The benchmark (data/evaluation/test_dataset.json) already says what the whole system
should conclude for each RFQ. These metrics score each agent on its own job:

- Requirement Analysis    item accuracy: extracted the expected number of line items
- Validation & Planning   decision accuracy: proceed / clarify / escalate as expected
                          missing-requirement detection: on cases with a known gap
                          (`unsupported_fields`), raised at least one issue
                          false-alarm rate: on cases that should proceed, raised an issue
- Quotation & Communication  price accuracy: every expected unit price matches exactly
- Critic                  approval rate of final drafts, and how many revision rounds ran

`score_case` looks at one finished run; `summarize` turns a list of those into rates.
"""
from typing import Any, Dict, List, Optional

PRICE_TOLERANCE = 0.01


def effective_decision(state) -> Optional[str]:
    """The Validation & Planning decision. If the run was escalated before that agent
    could run (e.g. nothing to quote), the system's decision was still 'escalate'."""
    decision = (state.validation_plan or {}).get("decision")
    if decision:
        return decision
    decisions = state.orchestrator_decisions or []
    if decisions and decisions[-1].get("next") == "escalate":
        return "escalate"
    return None


def score_case(case: Dict[str, Any], state) -> Dict[str, Any]:
    """Per-agent results for one benchmark case. Keys are None when the case has no
    expectation for that agent."""
    out: Dict[str, Any] = {"eval_id": case.get("eval_id")}

    expected_items = case.get("expected_line_items")
    if expected_items is not None:
        got = len((state.extracted_requirements or {}).get("line_items", []) or [])
        out["extraction_items_ok"] = got == int(expected_items)

    decision = effective_decision(state)
    expected_decision = case.get("expected_decision")
    out["decision"] = decision
    if expected_decision:
        out["decision_ok"] = decision == expected_decision

    issues = (state.validation_plan or {}).get("issues", []) or []
    if case.get("unsupported_fields"):
        # a known gap: did Validation & Planning (or an early escalation) catch it?
        out["gap_detected"] = bool(issues) or decision in ("clarify", "escalate")
    if expected_decision == "proceed":
        out["false_alarm"] = bool(issues)

    expected_prices = case.get("expected_unit_prices")
    if expected_prices:
        quoted = {li.get("product_code"): li.get("unit_price")
                  for li in (state.quotation_draft or {}).get("line_items", []) or []}
        out["prices_ok"] = all(quoted.get(code) is not None and abs(quoted[code] - price) <= PRICE_TOLERANCE
                               for code, price in expected_prices.items())

    critic = state.critic_feedback or {}
    if critic:
        out["critic_verdict"] = critic.get("verdict")
        out["critic_rounds"] = critic.get("round", 0)
    return out


def _rate(values: List[bool]) -> Optional[float]:
    return round(100.0 * sum(values) / len(values), 1) if values else None


def summarize(scores: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Percentages per agent over the cases that had an expectation for it."""
    def pick(key):
        return [s[key] for s in scores if s.get(key) is not None]

    rounds = pick("critic_rounds")
    verdicts = pick("critic_verdict")
    return {
        "requirement_analysis": {"item_accuracy_pct": _rate(pick("extraction_items_ok")),
                                 "cases": len(pick("extraction_items_ok"))},
        "validation_planning": {"decision_accuracy_pct": _rate(pick("decision_ok")),
                                "gap_detection_pct": _rate(pick("gap_detected")),
                                "false_alarm_pct": _rate(pick("false_alarm")),
                                "cases": len(pick("decision_ok"))},
        "quotation": {"price_accuracy_pct": _rate(pick("prices_ok")), "cases": len(pick("prices_ok"))},
        "critic": {"final_approval_pct": _rate([v == "approve" for v in verdicts]),
                   "avg_review_rounds": round(sum(rounds) / len(rounds), 2) if rounds else None,
                   "cases": len(verdicts)},
    }
