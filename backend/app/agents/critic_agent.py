import time

from app.agents.state import AgentState
from app.core.logging import logger


def run_critic_agent(state: AgentState) -> AgentState:
    """
    Critic Agent:
    Reviews the drafted quotation against the original RFQ requirements.

    The critic does not invent missing commercial information.
    It identifies whether the draft properly addresses
    the extracted customer requirements.
    """

    start_time = time.time()

    extracted = state.extracted_requirements
    draft = state.quotation_draft

    issues = []

    # ---------------------------------------------------------
    # 1. Check delivery requirement
    # ---------------------------------------------------------
    delivery_terms = extracted.get("delivery_terms")

    if delivery_terms:
        draft_text = str(draft).lower()

        delivery_keywords = [
            "delivery",
            "lead time",
            "surat",
            "3 days",
            "three days",
        ]

        delivery_addressed = any(
            keyword in draft_text
            for keyword in delivery_keywords
        )

        if not delivery_addressed:
            issues.append({
                "field": "delivery_terms",
                "issue": (
                    "Customer delivery requirement is present in "
                    "the RFQ but is not addressed in the quotation draft."
                ),
                "customer_requirement": delivery_terms,
                "required_action": (
                    "Add a clarification question asking the customer "
                    "to confirm the requested delivery timeline/location, "
                    "because the approved knowledge base does not provide "
                    "sufficient evidence to promise it."
                )
            })

    # ---------------------------------------------------------
    # 2. Check payment terms
    # ---------------------------------------------------------
    payment_terms = extracted.get("payment_terms")

    if payment_terms:
        draft_text = str(draft).lower()

        if "payment" not in draft_text and "credit" not in draft_text:
            issues.append({
                "field": "payment_terms",
                "issue": (
                    "Customer payment terms are present in the RFQ "
                    "but are not addressed in the quotation draft."
                ),
                "customer_requirement": payment_terms,
                "required_action": (
                    "Address the requested payment terms or generate "
                    "a clarification question if the terms cannot "
                    "be verified."
                )
            })

    # ---------------------------------------------------------
    # 3. Check line items
    # ---------------------------------------------------------
    required_items = extracted.get("line_items", [])
    drafted_items = draft.get("line_items", [])

    if len(drafted_items) < len(required_items):
        issues.append({
            "field": "line_items",
            "issue": (
                "One or more requested line items are missing "
                "from the quotation draft."
            ),
            "required_action": (
                "Ensure every extracted RFQ line item is represented."
            )
        })

    # ---------------------------------------------------------
    # 4. Determine critic decision
    # ---------------------------------------------------------
    if issues:
        decision = "revise"
        critic_status = "REVISION_REQUIRED"
    else:
        decision = "pass"
        critic_status = "PASSED"

    state.critic_feedback = {
        "decision": decision,
        "status": critic_status,
        "issues": issues,
        "reviewed_revision": state.revision_count,
    }

    elapsed_ms = int((time.time() - start_time) * 1000)

    state.agent_traces.append({
        "agent_name": "Critic Agent",
        "status": "WARNING" if issues else "SUCCESS",
        "output_summary": (
            f"Critic decision={decision}. "
            f"Issues found={len(issues)}."
        ),
        "execution_time_ms": elapsed_ms,
    })

    logger.info(
        f"Critic Agent completed in {elapsed_ms}ms "
        f"with decision={decision}"
    )

    return state
