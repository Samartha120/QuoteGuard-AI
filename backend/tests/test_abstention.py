from app.agents.state import AgentState
from app.agents.planning_agent import run_planning_agent

def test_abstention_logic_spec_mismatch():
    state = AgentState(
        rfq_id="rfq_test_02",
        raw_text="Need IV-200 in SS316 grade",
        extracted_requirements={
            "line_items": [
                {
                    "product_name": "Industrial Valve IV-200",
                    "product_code": "IV-200",
                    "material_grade": "SS316",
                    "quantity": 50
                }
            ]
        }
    )
    
    evaluated_state = run_planning_agent(state)
    assert evaluated_state.abstention_required is True
    assert evaluated_state.grounded_status == "ABSTAINED"
    assert evaluated_state.overall_confidence < 0.80
