from app.agents.drafting_agent import _analyze_task, _select_tools
from app.agents.state import AgentState


def make_state(**kwargs):
    state = AgentState(
        rfq_id="TEST-DRAFTING-001",
        raw_text="Test RFQ",
        customer_name="Test Customer",
    )

    for key, value in kwargs.items():
        setattr(state, key, value)

    return state


def test_analyze_task_creates_grounded_quotation():
    state = make_state(
        extracted_requirements={
            "line_items": [
                {
                    "product_name": "Industrial Valve",
                    "quantity": 10,
                }
            ]
        },
        retrieved_evidence=[{"content": "Approved catalogue evidence"}],
        validation_plan={"decision": "proceed"},
    )

    plan = _analyze_task(
        state,
        "validation & planning: proceed; draft the priced quotation",
    )

    assert plan["objective"] == "create_grounded_quotation"
    assert plan["revision_requested"] is False
    assert plan["has_requirements"] is True
    assert plan["has_evidence"] is True
    assert plan["has_validation_plan"] is True


def test_analyze_task_prepares_clarification_when_abstaining():
    state = make_state(
        extracted_requirements={
            "line_items": [
                {
                    "product_name": "Industrial Valve",
                    "quantity": 10,
                }
            ]
        },
        abstention_required=True,
    )

    plan = _analyze_task(
        state,
        "validation & planning: clarify; prepare customer clarification",
    )

    assert plan["objective"] == "prepare_clarification"


def test_select_tools_for_grounded_quotation():
    state = make_state(
        extracted_requirements={
            "line_items": [
                {
                    "product_name": "Industrial Valve",
                    "quantity": 10,
                }
            ]
        },
        abstention_required=False,
    )

    plan = {
        "objective": "create_grounded_quotation",
    }

    tools = _select_tools(state, plan)

    assert tools == [
        "lookup_product",
        "price_for_quantity",
        "calculate_quotation_totals",
    ]


def test_select_tools_for_clarification_does_not_price():
    state = make_state(
        extracted_requirements={
            "line_items": [
                {
                    "product_name": "Industrial Valve",
                    "quantity": 10,
                }
            ]
        },
        abstention_required=True,
    )

    plan = {
        "objective": "prepare_clarification",
    }

    tools = _select_tools(state, plan)

    assert tools == ["lookup_product"]
