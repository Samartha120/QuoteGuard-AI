from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator

def test_full_agent_workflow():
    initial_state = AgentState(
        rfq_id="test_rfq_01",
        raw_text="Request for quotation Apex Engineering IV-200 quantity 20 units Net 30 days"
    )
    
    final_state = workflow_orchestrator.run_pipeline(initial_state)
    assert len(final_state.agent_traces) == 5
    assert final_state.quotation_draft is not None
