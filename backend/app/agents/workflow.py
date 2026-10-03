from app.agents.state import AgentState
from app.agents.requirement_agent import run_requirement_agent
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.planning_agent import run_planning_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.drafting_agent import run_drafting_agent
from app.agents.critic_agent import run_critic_agent
from app.core.logging import logger


class AgentWorkflowOrchestrator:
    """
    Explicit multi-stage QuoteGuard AI workflow.

    Pipeline:
        Requirement
            ↓
        Retrieval
            ↓
        Planning
            ↓
        Validation
            ↓
        Drafting
            ↓
        Critic
            ↓
        Revision if required
    """

    MAX_REVISIONS = 2

    def run_pipeline(self, initial_state: AgentState) -> AgentState:

        logger.info(
            f"--- Starting QuoteGuard Agent Workflow "
            f"for RFQ {initial_state.rfq_id} ---"
        )

        # -----------------------------------------------------
        # Stage 1: Requirement Extraction
        # -----------------------------------------------------
        state = run_requirement_agent(initial_state)

        state.orchestrator_decisions.append({
            "stage": "Requirement Extraction",
            "decision": "continue",
            "reason": "Requirements extracted."
        })

        # -----------------------------------------------------
        # Stage 2: Retrieval
        # -----------------------------------------------------
        state = run_retrieval_agent(state)

        state.orchestrator_decisions.append({
            "stage": "Retrieval",
            "decision": "continue",
            "reason": "Evidence retrieved from approved knowledge base."
        })

        # -----------------------------------------------------
        # Stage 3: Planning
        # -----------------------------------------------------
        state = run_planning_agent(state)

        state.orchestrator_decisions.append({
            "stage": "Planning",
            "decision": (
                "abstain"
                if state.abstention_required
                else "continue"
            ),
            "reason": (
                "Unsupported or insufficiently grounded requirements detected."
                if state.abstention_required
                else "Requirements sufficiently grounded."
            )
        })

        # -----------------------------------------------------
        # Stage 4: Validation
        # -----------------------------------------------------
        state = run_validation_agent(state)

        state.orchestrator_decisions.append({
            "stage": "Validation",
            "decision": "continue",
            "reason": "Commercial attributes validated."
        })

        # -----------------------------------------------------
        # Stage 5 + Critic Revision Loop
        # -----------------------------------------------------
        while True:

            # Draft quotation
            state = run_drafting_agent(state)

            state.orchestrator_decisions.append({
                "stage": "Drafting",
                "decision": "draft_created",
                "revision_count": state.revision_count
            })

            # Critic reviews quotation
            state = run_critic_agent(state)

            critic_decision = state.critic_feedback.get(
                "decision",
                "pass"
            )

            # -------------------------------------------------
            # Critic PASSED
            # -------------------------------------------------
            if critic_decision == "pass":

                state.orchestrator_decisions.append({
                    "stage": "Critic",
                    "decision": "pass",
                    "revision_count": state.revision_count
                })

                break

            # -------------------------------------------------
            # Maximum revision limit reached
            # -------------------------------------------------
            if state.revision_count >= self.MAX_REVISIONS:

                state.orchestrator_decisions.append({
                    "stage": "Critic",
                    "decision": "max_revisions_reached",
                    "revision_count": state.revision_count
                })

                logger.warning(
                    f"Maximum revisions reached for RFQ "
                    f"{state.rfq_id}"
                )

                break

            # -------------------------------------------------
            # Request revision
            # -------------------------------------------------
            state.revision_count += 1

            state.orchestrator_decisions.append({
                "stage": "Critic",
                "decision": "revise",
                "revision_count": state.revision_count,
                "issues": state.critic_feedback.get(
                    "issues",
                    []
                )
            })

            logger.info(
                f"Critic requested revision "
                f"{state.revision_count} for RFQ "
                f"{state.rfq_id}"
            )

        logger.info(
            f"--- Agent Workflow Completed for RFQ "
            f"{state.rfq_id} ---"
        )

        return state


workflow_orchestrator = AgentWorkflowOrchestrator()
