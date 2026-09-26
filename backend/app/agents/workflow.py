from app.agents.state import AgentState
from app.agents.requirement_agent import run_requirement_agent
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.planning_agent import run_planning_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.drafting_agent import run_drafting_agent
from app.core.logging import logger

class AgentWorkflowOrchestrator:
    """Explicit 5-stage agent pipeline orchestrator (LangGraph / StateMachine abstraction)."""

    def run_pipeline(self, initial_state: AgentState) -> AgentState:
        logger.info(f"--- Starting QuoteGuard Agent Workflow for RFQ {initial_state.rfq_id} ---")
        
        # Stage 1: Requirement Extraction
        state = run_requirement_agent(initial_state)
        
        # Stage 2: Retrieval Agent (Tool Calling)
        state = run_retrieval_agent(state)
        
        # Stage 3: Planning Agent (Knowledge Sufficiency Strategy)
        state = run_planning_agent(state)
        
        # Stage 4: Validation Agent (Grounding Verification)
        state = run_validation_agent(state)
        
        # Stage 5: Drafting Agent (Quotation OR Abstention Clarification)
        state = run_drafting_agent(state)
        
        logger.info(f"--- Agent Workflow Completed for RFQ {state.rfq_id} ---")
        return state

workflow_orchestrator = AgentWorkflowOrchestrator()
