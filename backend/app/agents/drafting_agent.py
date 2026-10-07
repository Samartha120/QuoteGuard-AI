import time
from typing import Any, Dict, List

from app.agents.state import AgentState
from app.tools.quotation_tool import calculate_quotation_totals
from app.tools.pricing_catalog import (
    lookup_product,
    price_for_quantity,
    approved_grades,
)
from app.utils.citations import build_citation_reference
from app.core.logging import logger


AGENT_NAME = "Quotation & Communication Agent"


def _grade_list() -> str:
    """Return the currently approved material grades."""
    grades = sorted(g for g in approved_grades() if g)
    return ", ".join(grades) if grades else "the approved catalog grades"


def _latest_supervisor_task(state: AgentState) -> str:
    """Read the latest task handed to this agent by the supervisor."""
    for message in reversed(state.messages):
        if (
            message.get("to") == "drafting"
            and message.get("type") == "task"
        ):
            return str(message.get("content", "")).strip()

    return ""


def _is_revision_task(state: AgentState, task: str) -> bool:
    """Determine whether this invocation is responding to critic feedback."""
    if state.critic_feedback.get("verdict") == "revise":
        return True

    text = task.lower()
    revision_words = (
        "critic",
        "revision",
        "revise",
        "review",
        "fix",
        "feedback",
    )
    return any(word in text for word in revision_words)


def _critic_revision_questions(
    state: AgentState,
    clarification_questions: List[str],
) -> List[str]:
    """
    Convert critic findings assigned to drafting into customer-facing
    clarification questions.

    The critic remains the source of the finding; this agent decides how
    to incorporate that finding into the quotation communication.
    """
    critic = state.critic_feedback or {}

    if critic.get("verdict") != "revise":
        return clarification_questions

    for issue in critic.get("issues", []):
        if issue.get("fix_by") != "drafting":
            continue

        detail = str(issue.get("detail", "")).strip()
        line = str(issue.get("line", "terms")).strip()

        if not detail:
            continue

        question = (
            f"Clarification Required ({line}): {detail} "
            "Please confirm the acceptable requirement before a formal "
            "quotation is issued."
        )

        if question not in clarification_questions:
            clarification_questions.append(question)

    return clarification_questions


def _analyze_task(state: AgentState, task: str) -> Dict[str, Any]:
    """
    Agent planning step.

    The agent decides what kind of work is required from the current state
    instead of blindly executing one fixed quotation path.
    """
    revision = _is_revision_task(state, task)

    if revision:
        objective = "revise_existing_draft"
    elif state.abstention_required:
        objective = "prepare_clarification"
    else:
        objective = "create_grounded_quotation"

    return {
        "objective": objective,
        "revision_requested": revision,
        "has_requirements": bool(
            state.extracted_requirements.get("line_items")
        ),
        "has_evidence": bool(state.retrieved_evidence),
        "has_validation_plan": bool(state.validation_plan),
        "critic_verdict": state.critic_feedback.get("verdict"),
        "task": task,
    }


def _select_tools(
    state: AgentState,
    plan: Dict[str, Any],
) -> List[str]:
    """
    Decide which tools are necessary for the current task.

    The agent does not call tools unnecessarily.
    """
    tools: List[str] = []

    # Product identification is needed whenever line items must be quoted
    # or checked against the approved catalogue.
    if state.extracted_requirements.get("line_items"):
        tools.append("lookup_product")

    # Pricing is only required for a grounded quotation.
    if plan["objective"] == "create_grounded_quotation":
        tools.append("price_for_quantity")

    # A revision may still need pricing if a valid priced draft exists.
    elif plan["objective"] == "revise_existing_draft":
        draft = state.quotation_draft or {}
        if draft.get("status") == "PENDING_APPROVAL":
            tools.append("price_for_quantity")

    # Totals are required whenever a priced quotation is being produced.
    if (
        plan["objective"] in {
            "create_grounded_quotation",
            "revise_existing_draft",
        }
        and not state.abstention_required
    ):
        tools.append("calculate_quotation_totals")

    return tools


def _record_trace(
    state: AgentState,
    step: str,
    decision: str,
    details: Dict[str, Any] | None = None,
) -> None:
    """Append a structured reasoning/action step to the execution trace."""
    state.agent_traces.append(
        {
            "agent_name": AGENT_NAME,
            "status": "ACTION",
            "output_summary": f"[{step}] {decision}",
            "step": step,
            "decision": decision,
            "details": details or {},
            "execution_time_ms": 0,
        }
    )


def _build_abstention_draft(
    state: AgentState,
    req_items: List[Dict[str, Any]],
    evidence_chunks: List[Dict[str, Any]],
) -> tuple[Dict[str, Any], List[str]]:
    """Build a clarification-only quotation when requirements are not grounded."""
    draft_line_items: List[Dict[str, Any]] = []
    clarification_questions: List[str] = []

    customer_issues = [
        issue
        for issue in (state.validation_plan or {}).get("issues", [])
        if issue.get("resolver") == "customer"
    ]

    clarification_questions.extend(
        [
            (
                f"Clarification Required ({issue.get('item', 'requirement')}): "
                f"{str(issue.get('detail', '')).strip()}. "
                "Please confirm the acceptable requirement before a formal "
                "quotation is issued."
            )
            for issue in customer_issues
            if str(issue.get("detail", "")).strip()
        ]
    )

    for item in req_items:
        p_name = item.get("product_name", "")
        material = item.get("material_grade", "")
        qty = item.get("quantity", 1)

        row = lookup_product(
            item.get("product_code", ""),
            p_name,
        )

        draft_line_items.append(
            {
                "product_code": (
                    f"{row['code']}-UNVERIFIED"
                    if row
                    else "UNVERIFIED"
                ),
                "product_name": (
                    f"{p_name} ({material or 'custom'} variant)"
                ),
                "material_grade": material or "unspecified",
                "quantity": qty,
                "unit_price": None,
                "total_price": None,
                "confidence_score": state.field_confidences.get(
                    p_name,
                    0.40,
                ),
                "status": "abstained",
                "citations": [
                    build_citation_reference(
                        field_name="material_grade",
                        evidence_chunks=evidence_chunks,
                        default_file="product_catalog_2026.md",
                        default_snippet=(
                            "Custom alloy grades require explicit "
                            "engineering evaluation and custom pricing."
                        ),
                    )
                ],
            }
        )

    payment_terms = state.extracted_requirements.get("payment_terms")

    if payment_terms:
        from app.agents.validation_planning_agent import credit_days

        requested_credit_days = credit_days(payment_terms)

        if requested_credit_days is not None and requested_credit_days > 30:
            clarification_questions.append(
                f"Commercial Credit Policy Mismatch: Customer requested "
                f"{requested_credit_days}-day credit terms. Standard company "
                "policy is Net 30 Days. Requires CFO approval."
            )

    draft = {
        "customer_name": state.customer_name,
        "subtotal": 0.0,
        "tax_amount": 0.0,
        "total_amount": 0.0,
        "status": "CLARIFICATION_REQUIRED",
        "line_items": draft_line_items,
    }

    return draft, clarification_questions


def _build_grounded_draft(
    state: AgentState,
    req_items: List[Dict[str, Any]],
    evidence_chunks: List[Dict[str, Any]],
) -> tuple[Dict[str, Any], List[Dict[str, Any]], List[str]]:
    """
    Execute the quotation tools and construct a grounded quotation.

    No price is generated by the LLM or hardcoded in this agent.
    """
    draft_line_items: List[Dict[str, Any]] = []
    tool_results: List[Dict[str, Any]] = []
    clarification_questions: List[str] = []

    for item in req_items:
        p_name = item.get("product_name", "")
        qty = item.get("quantity", 1)

        # TOOL 1: resolve product against approved catalogue.
        row = lookup_product(
            item.get("product_code", ""),
            p_name,
        )

        tool_results.append(
            {
                "tool": "lookup_product",
                "product": p_name,
                "found": row is not None,
            }
        )

        if row is None:
            draft_line_items.append(
                {
                    "product_code": "UNVERIFIED",
                    "product_name": p_name,
                    "material_grade": item.get("material_grade", ""),
                    "quantity": qty,
                    "unit_price": None,
                    "total_price": None,
                    "confidence_score": state.field_confidences.get(
                        p_name,
                        0.0,
                    ),
                    "status": "unverified",
                    "citations": [],
                }
            )

            clarification_questions.append(
                f"Product Clarification Required: "
                f"'{p_name}' could not be matched to an approved "
                "catalogue item. Please confirm the exact approved "
                "product or request internal review."
            )
            continue

        # TOOL 2: derive grounded quantity-based pricing.
        pricing = price_for_quantity(row, qty)

        tool_results.append(
            {
                "tool": "price_for_quantity",
                "product": p_name,
                "quantity": qty,
                "list_price": pricing["list_price"],
                "unit_price": pricing["unit_price"],
                "discount_rate": pricing["discount_rate"],
                "total_price": pricing["total_price"],
            }
        )

        discount_note = (
            f" (bulk discount {pricing['discount_rate']}% applied "
            f"at qty {qty})"
            if pricing["discount_rate"]
            else ""
        )

        citation = build_citation_reference(
            field_name="unit_price",
            evidence_chunks=evidence_chunks,
            default_file=row["source"],
            default_snippet=(
                f"{row['name']} ({row['grade']}) — "
                f"INR {row['unit_price']}/unit{discount_note}"
            ),
        )

        draft_line_items.append(
            {
                "product_code": row["code"],
                "product_name": row["name"],
                "material_grade": row["grade"],
                "quantity": qty,
                "unit_price": pricing["unit_price"],
                "total_price": pricing["total_price"],
                "confidence_score": state.field_confidences.get(
                    p_name,
                    0.96,
                ),
                "status": "verified",
                "citations": [citation],
            }
        )

    # TOOL 3: calculate quotation totals only from grounded line items.
    totals = calculate_quotation_totals(draft_line_items)

    tool_results.append(
        {
            "tool": "calculate_quotation_totals",
            "subtotal": totals["subtotal"],
            "tax_amount": totals["tax_amount"],
            "total_amount": totals["total_amount"],
        }
    )

    draft = {
        "customer_name": state.customer_name,
        "subtotal": totals["subtotal"],
        "tax_amount": totals["tax_amount"],
        "total_amount": totals["total_amount"],
        "status": "PENDING_APPROVAL",
        "line_items": draft_line_items,
    }

    return draft, tool_results, clarification_questions


def _evaluate_results(
    draft: Dict[str, Any],
    tool_results: List[Dict[str, Any]],
    clarification_questions: List[str],
) -> Dict[str, Any]:
    """Agent evaluation step after tool execution."""
    line_items = draft.get("line_items", [])

    verified_count = sum(
        1 for item in line_items
        if item.get("status") == "verified"
    )

    unverified_count = sum(
        1 for item in line_items
        if item.get("status") in {"unverified", "abstained"}
    )

    if unverified_count > 0:
        decision = "clarification_required"
    elif verified_count == len(line_items) and line_items:
        decision = "quotation_ready"
    else:
        decision = "clarification_required"

    return {
        "decision": decision,
        "line_items": len(line_items),
        "verified_items": verified_count,
        "unverified_items": unverified_count,
        "tool_calls": len(tool_results),
        "clarification_count": len(clarification_questions),
    }


def run_drafting_agent(state: AgentState) -> AgentState:
    """
    Quotation & Communication Agent.

    The agent:
      1. analyzes the supervisor task,
      2. creates a plan,
      3. selects appropriate quotation tools,
      4. executes grounded tools,
      5. evaluates their results,
      6. adapts to critic feedback,
      7. produces a quotation or clarification request.

    Commercial values always come from the approved catalogue/tools.
    """
    start_time = time.time()

    extracted = state.extracted_requirements or {}
    req_items = extracted.get("line_items", []) or []
    evidence_chunks = state.retrieved_evidence or []

    task = _latest_supervisor_task(state)

    # ------------------------------------------------------------------ #
    # 1. TASK ANALYSIS
    # ------------------------------------------------------------------ #
    plan = _analyze_task(state, task)

    _record_trace(
        state,
        "task_analysis",
        plan["objective"],
        {
            "revision_requested": plan["revision_requested"],
            "task": task,
            "line_items": len(req_items),
            "critic_verdict": plan["critic_verdict"],
        },
    )

    # ------------------------------------------------------------------ #
    # 2. TOOL SELECTION
    # ------------------------------------------------------------------ #
    selected_tools = _select_tools(state, plan)

    _record_trace(
        state,
        "tool_selection",
        "Selected tools for current quotation task",
        {
            "tools": selected_tools,
            "reason": (
                "Tools selected according to quotation objective and "
                "current state instead of executing every tool blindly."
            ),
        },
    )

    # ------------------------------------------------------------------ #
    # 3. REVISION / CRITIC FEEDBACK
    # ------------------------------------------------------------------ #
    clarification_questions: List[str] = []
    tool_results: List[Dict[str, Any]] = []

    revision_questions = _critic_revision_questions(
        state,
        clarification_questions,
    )

    if revision_questions:
        _record_trace(
            state,
            "critic_feedback_analysis",
            "Applied critic findings assigned to drafting",
            {
                "questions_added": revision_questions,
                "critic_round": state.critic_feedback.get("round"),
            },
        )

    # ------------------------------------------------------------------ #
    # 4. EXECUTE SELECTED TOOLS
    # ------------------------------------------------------------------ #
    if state.abstention_required:
        draft, generated_questions = _build_abstention_draft(
            state,
            req_items,
            evidence_chunks,
        )

        clarification_questions.extend(generated_questions)

        _record_trace(
            state,
            "tool_execution",
            "Prepared clarification draft because quotation is not grounded",
            {
                "tools_executed": ["lookup_product"],
                "reason": "abstention_required=True",
            },
        )

    else:
        draft, tool_results, generated_questions = _build_grounded_draft(
            state,
            req_items,
            evidence_chunks,
        )

        clarification_questions.extend(generated_questions)

        _record_trace(
            state,
            "tool_execution",
            "Executed grounded quotation tools",
            {
                "tools_selected": selected_tools,
                "tool_results": tool_results,
            },
        )

    # Add critic-generated questions after normal draft processing.
    for question in revision_questions:
        if question not in clarification_questions:
            clarification_questions.append(question)

    # ------------------------------------------------------------------ #
    # 5. RESULT EVALUATION
    # ------------------------------------------------------------------ #
    evaluation = _evaluate_results(
        draft,
        tool_results if not state.abstention_required else [],
        clarification_questions,
    )

    _record_trace(
        state,
        "result_evaluation",
        evaluation["decision"],
        evaluation,
    )

    # If the agent discovered an unresolved requirement, the quotation
    # cannot be presented as fully ready.
    if clarification_questions:
        draft["status"] = "CLARIFICATION_REQUIRED"

    # ------------------------------------------------------------------ #
    # 6. FINALIZE STATE
    # ------------------------------------------------------------------ #
    state.clarification_questions = clarification_questions

    # Preserve validation advisories in the final quotation so the
    # customer-facing response can display them.
    draft["advisories"] = list(
        (state.validation_plan or {}).get("advisories", [])
    )

    state.quotation_draft = draft

    if draft["status"] == "CLARIFICATION_REQUIRED":
        state.escalation_notes = (
            "Quotation & Communication Agent identified unresolved "
            "requirements. Clarification is required before formal "
            "quotation issuance."
        )

    elapsed_ms = int((time.time() - start_time) * 1000)

    state.agent_traces.append(
        {
            "agent_name": AGENT_NAME,
            "status": "SUCCESS",
            "output_summary": (
                f"Agent decision={evaluation['decision']}. "
                f"Status={draft.get('status')}. "
                f"Line Items={len(draft.get('line_items', []))}. "
                f"Clarifications={len(clarification_questions)}."
            ),
            "execution_time_ms": elapsed_ms,
        }
    )

    logger.info(
        f"{AGENT_NAME} completed in {elapsed_ms}ms "
        f"with decision={evaluation['decision']}"
    )

    return state
