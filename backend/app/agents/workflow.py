from app.agents.state import AgentState
from app.agents import orchestrator
from app.core.logging import logger

class AgentWorkflowOrchestrator:
    """Entry point used by the services. Runs the supervisor graph in orchestrator.py,
    which picks the next agent after each step instead of a fixed order."""

    def run_pipeline(self, initial_state: AgentState) -> AgentState:
        logger.info(f"--- Starting QuoteGuard Agent Workflow for RFQ {initial_state.rfq_id} ---")
        state = orchestrator.run(initial_state)
        route = " -> ".join(d["next"] for d in state.orchestrator_decisions)
        logger.info(f"--- Agent Workflow Completed for RFQ {state.rfq_id}: {route} ---")
        return state

workflow_orchestrator = AgentWorkflowOrchestrator()
