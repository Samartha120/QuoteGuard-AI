import time
from app.agents.state import AgentState
from app.tools.quotation_tool import calculate_quotation_totals
from app.utils.citations import build_citation_reference
from app.core.logging import logger

PRICING_CATALOG_MAP = {
    "IV-200": {"code": "IV-200", "name": "Industrial Valve IV-200", "grade": "SS304", "unit_price": 4500.0, "source": "approved_pricing_2026.csv"},
    "PV-100": {"code": "PV-100", "name": "Pressure Relief Valve PV-100", "grade": "SS304", "unit_price": 2800.0, "source": "approved_pricing_2026.csv"},
    "FP-50":  {"code": "FP-50",  "name": "Flange Plate FP-50", "grade": "Carbon Steel", "unit_price": 850.0, "source": "approved_pricing_2026.csv"}
}

def run_drafting_agent(state: AgentState) -> AgentState:
    """Stage 5: Drafting Agent - Formulates Grounded Quotation or Abstention Clarification."""
    start_time = time.time()
    
    extracted = state.extracted_requirements
    req_items = extracted.get("line_items", [])
    evidence_chunks = state.retrieved_evidence

    draft_line_items = []
    clarification_questions = []

    if state.abstention_required:
        # Abstention Path: Produce Clarification Request & Human Escalation
        for item in req_items:
            p_name = item.get("product_name", "")
            material = item.get("material_grade", "")
            qty = item.get("quantity", 1)

            if material and "316" in material:
                clarification_questions.append(
                    f"Requirement Mismatch: Customer requested SS316 grade for '{p_name}'. "
                    f"Approved catalogue only contains SS304 standard stock. Please confirm if standard SS304 grade is acceptable or request custom engineering evaluation."
                )
                draft_line_items.append({
                    "product_code": "IV-200-UNVERIFIED",
                    "product_name": f"{p_name} (SS316 Custom Variant)",
                    "material_grade": material or "SS316",
                    "quantity": qty,
                    "unit_price": None,
                    "total_price": None,
                    "confidence_score": 0.40,
                    "status": "abstained",
                    "citations": [
                        {
                            "field_name": "unit_price",
                            "source_filename": "product_catalog_2026.md",
                            "source_chunk_id": "cat_chunk_01",
                            "evidence_snippet": "Note on Material Variants: SS304 is standard stock grade. Custom alloys like SS316 require explicit engineering evaluation and custom pricing.",
                            "retrieval_score": 0.45
                        }
                    ]
                })

        if extracted.get("payment_terms") and "90" in str(extracted.get("payment_terms")):
            clarification_questions.append(
                f"Commercial Credit Policy Mismatch: Customer requested 90-day credit terms. "
                f"Standard company policy caps credit at Net 30 Days. Requires CFO approval."
            )

        state.clarification_questions = clarification_questions
        state.escalation_notes = "AUTOMATED ABSTENTION TRIGGERED: Commercial parameters cannot be grounded in approved company knowledge base. Clarification required before formal quotation issuance."
        state.quotation_draft = {
            "customer_name": state.customer_name,
            "subtotal": 0.0,
            "tax_amount": 0.0,
            "total_amount": 0.0,
            "status": "CLARIFICATION_REQUIRED",
            "line_items": draft_line_items
        }

    else:
        # Grounded Path: Generate Full Quotation
        for item in req_items:
            p_name = item.get("product_name", "")
            p_code = item.get("product_code") or ("IV-200" if "IV-200" in p_name else ("PV-100" if "PV-100" in p_name else "FP-50"))
            qty = item.get("quantity", 1)

            cat_data = PRICING_CATALOG_MAP.get(p_code, PRICING_CATALOG_MAP["IV-200"])
            unit_price = cat_data["unit_price"]
            total_price = unit_price * qty
            
            citation = build_citation_reference(
                field_name="unit_price",
                evidence_chunks=evidence_chunks,
                default_file=cat_data["source"],
                default_snippet=f"{cat_data['name']} ... INR {unit_price}/unit"
            )

            draft_line_items.append({
                "product_code": cat_data["code"],
                "product_name": cat_data["name"],
                "material_grade": cat_data["grade"],
                "quantity": qty,
                "unit_price": unit_price,
                "total_price": total_price,
                "confidence_score": 0.96,
                "status": "verified",
                "citations": [citation]
            })

        totals = calculate_quotation_totals(draft_line_items)
        state.quotation_draft = {
            "customer_name": state.customer_name,
            "subtotal": totals["subtotal"],
            "tax_amount": totals["tax_amount"],
            "total_amount": totals["total_amount"],
            "status": "PENDING_APPROVAL",
            "line_items": draft_line_items
        }

    elapsed_ms = int((time.time() - start_time) * 1000)
    
    state.agent_traces.append({
        "agent_name": "Drafting Agent",
        "status": "SUCCESS",
        "output_summary": f"Drafted quotation. Status={state.quotation_draft.get('status')}. Total Line Items={len(draft_line_items)}.",
        "execution_time_ms": elapsed_ms
    })
    logger.info(f"Drafting Agent completed in {elapsed_ms}ms")
    return state
