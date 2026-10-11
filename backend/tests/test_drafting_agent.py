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


def test_generate_customer_email_for_grounded_quotation():
    from app.agents.drafting_agent import generate_customer_email
    state = make_state(customer_name="Apex Engineering", rfq_id="RFQ-100")
    draft = {
        "status": "PENDING_APPROVAL",
        "total_amount": 155760.0,
        "line_items": [{"product_code": "IV-200"}],
    }
    email = generate_customer_email(state, draft, [])
    assert "Apex Engineering" in email
    assert "RFQ-100" in email
    assert "155,760.00" in email
    assert "Purchase Order" in email


def test_generate_customer_email_for_clarification():
    from app.agents.drafting_agent import generate_customer_email
    state = make_state(customer_name="Apex Engineering", rfq_id="RFQ-101", abstention_required=True)
    draft = {"status": "CLARIFICATION_REQUIRED"}
    questions = ["Clarification Required: Material grade is unspecified."]
    email = generate_customer_email(state, draft, questions)
    assert "Apex Engineering" in email
    assert "Clarification Required" in email
    assert "sales@vertexind.com" in email


def test_internal_escalation_holding_message():
    from app.agents.drafting_agent import _build_abstention_draft
    state = make_state(
        validation_plan={
            "decision": "escalate",
            "issues": [
                {"item": "credit", "resolver": "internal", "detail": "Customer requested Net 60 which exceeds limit."}
            ]
        }
    )
    draft, questions = _build_abstention_draft(state, [{"product_name": "Industrial Valve"}], [])
    assert len(questions) >= 1
    assert any("commercial review" in q.lower() or "commercial advisory" in q.lower() for q in questions)

