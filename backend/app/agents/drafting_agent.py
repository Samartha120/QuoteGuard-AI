import time

from app.agents.state import AgentState
from app.tools.quotation_tool import calculate_quotation_totals
from app.tools.pricing_catalog import lookup_product, price_for_quantity, approved_grades
from app.utils.citations import build_citation_reference
from app.core.logging import logger


def _grade_list() -> str:
    grades = sorted(g for g in approved_grades() if g)
    return ", ".join(grades) if grades else "the approved catalog grades"


def _apply_critic_revision(
    state: AgentState,
    clarification_questions: list,
) -> list:
    """Apply critic findings assigned to the drafting agent."""
    critic = state.critic_feedback or {}

    if critic.get("verdict") != "revise":
        return clarification_questions

    for issue in critic.get("issues", []):
        if issue.get("fix_by") != "drafting":
            continue

        line = issue.get("line", "terms")
        detail = str(issue.get("detail", "")).strip()

        if not detail:
            continue

        question = (
            f"Clarification Required ({line}): {detail} "
            "Please confirm the acceptable requirement before a formal quotation is issued."
        )

        if question not in clarification_questions:
            clarification_questions.append(question)

    return clarification_questions


def run_drafting_agent(state: AgentState) -> AgentState:
    """Stage 5: Drafting Agent - Formulates Grounded Quotation or Abstention Clarification.

    Pricing and specifications are derived entirely from the approved pricing catalog
    (data/pricing/approved_pricing_2026.csv) — the single source of truth. No prices are
    hardcoded; citations are grounded in real retrieved evidence chunks.
    """
    start_time = time.time()

    extracted = state.extracted_requirements
    req_items = extracted.get("line_items", [])
    evidence_chunks = state.retrieved_evidence

    draft_line_items = []
    clarification_questions = []

    # Apply critic findings assigned to the drafting agent.
    clarification_questions = _apply_critic_revision(
        state,
        clarification_questions,
    )

    if state.abstention_required:
        # Abstention Path: Produce Clarification Request & Human Escalation
        for item in req_items:
            p_name = item.get("product_name", "")
            material = item.get("material_grade", "")
            qty = item.get("quantity", 1)

            row = lookup_product(
                item.get("product_code", ""),
                p_name,
            )

            clarification_questions.append(
                f"Requirement Mismatch: Customer requested "
                f"'{material or 'unspecified'}' grade for '{p_name}'. "
                f"Approved catalogue only stocks: {_grade_list()}. "
                f"Please confirm if a standard approved grade is acceptable "
                f"or request a custom engineering evaluation."
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

        if (
            extracted.get("payment_terms")
            and "90" in str(extracted.get("payment_terms"))
        ):
            clarification_questions.append(
                "Commercial Credit Policy Mismatch: Customer requested "
                "90-day credit terms. Standard company policy caps credit "
                "at Net 30 Days. Requires CFO approval."
            )

        state.clarification_questions = clarification_questions

        state.escalation_notes = (
            "AUTOMATED ABSTENTION TRIGGERED: Commercial parameters cannot "
            "be grounded in approved company knowledge base. "
            "Clarification required before formal quotation issuance."
        )

        state.quotation_draft = {
            "customer_name": state.customer_name,
            "subtotal": 0.0,
            "tax_amount": 0.0,
            "total_amount": 0.0,
            "status": "CLARIFICATION_REQUIRED",
            "line_items": draft_line_items,
        }

    else:
        # Grounded Path: Generate Full Quotation from approved catalog
        for item in req_items:
            p_name = item.get("product_name", "")
            qty = item.get("quantity", 1)

            row = lookup_product(
                item.get("product_code", ""),
                p_name,
            )

            if row is None:
                draft_line_items.append(
                    {
                        "product_code": "UNVERIFIED",
                        "product_name": p_name,
                        "material_grade": item.get(
                            "material_grade",
                            "",
                        ),
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
                continue

            pricing = price_for_quantity(
                row,
                qty,
            )

            discount_note = (
                f" (bulk discount {pricing['discount_rate']}% "
                f"applied at qty {qty})"
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

        totals = calculate_quotation_totals(
            draft_line_items
        )

        state.quotation_draft = {
            "customer_name": state.customer_name,
            "subtotal": totals["subtotal"],
            "tax_amount": totals["tax_amount"],
            "total_amount": totals["total_amount"],
            "status": "PENDING_APPROVAL",
            "line_items": draft_line_items,
        }

    # Persist clarification questions for both normal drafting
    # and critic-driven revision.
    state.clarification_questions = clarification_questions

    elapsed_ms = int(
        (time.time() - start_time) * 1000
    )

    state.agent_traces.append(
        {
            "agent_name": "Drafting Agent",
            "status": "SUCCESS",
            "output_summary": (
                f"Drafted quotation. "
                f"Status={state.quotation_draft.get('status')}. "
                f"Total Line Items={len(draft_line_items)}."
            ),
            "execution_time_ms": elapsed_ms,
        }
    )

    logger.info(
        f"Drafting Agent completed in {elapsed_ms}ms"
    )

    return state
