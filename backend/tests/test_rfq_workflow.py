from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator

def test_full_agent_workflow():
    initial_state = AgentState(
        rfq_id="test_rfq_01",
        raw_text="Request for quotation Apex Engineering IV-200 quantity 20 units Net 30 days"
    )
    
    final_state = workflow_orchestrator.run_pipeline(initial_state)
    agents_run = [t["agent_name"] for t in final_state.agent_traces]
    for name in ("Requirement Analysis Agent", "Retrieval Agent", "Validation & Planning Agent",
                 "Quotation & Communication Agent", "Critic Agent"):
        assert name in agents_run
    assert final_state.quotation_draft is not None
