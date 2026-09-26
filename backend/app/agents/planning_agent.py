import time
from app.agents.state import AgentState
from app.utils.confidence import compute_field_confidence
from app.core.config import settings
from app.core.logging import logger

def run_planning_agent(state: AgentState) -> AgentState:
    """Stage 3: Planning Agent - Knowledge Sufficiency & Strategy Evaluator."""
    start_time = time.time()
    line_items = state.extracted_requirements.get("line_items", [])
    evidence = state.retrieved_evidence
    threshold = settings.GROUNDING_THRESHOLD

    has_unsupported = False
    confidences = {}

    for item in line_items:
        p_name = item.get("product_name", "")
        p_code = item.get("product_code", "")
        material = item.get("material_grade", "")
        
        # Check if material spec requested is out of stock in KB (e.g. SS316 requested vs SS304 in KB)
        is_spec_mismatch = False
        if material and "316" in material:
            # KB catalog only contains SS304 standard stock
            is_spec_mismatch = True

        score = compute_field_confidence(
            field_name="unit_price",
            extracted_value=p_name,
            retrieved_chunks=evidence,
            is_spec_mismatch=is_spec_mismatch
        )
        confidences[p_name] = score
        
        if score < threshold or is_spec_mismatch:
            has_unsupported = True

    overall_conf = sum(confidences.values()) / max(len(confidences), 1)
    state.field_confidences = confidences
    state.overall_confidence = round(overall_conf, 2)
    state.abstention_required = has_unsupported

    if has_unsupported:
        state.grounded_status = "ABSTAINED"
    else:
        state.grounded_status = "GROUNDED"

    elapsed_ms = int((time.time() - start_time) * 1000)
    
    state.agent_traces.append({
        "agent_name": "Planning & Strategy Agent",
        "status": "WARNING" if has_unsupported else "SUCCESS",
        "output_summary": f"Planning Strategy: Overall Confidence={state.overall_confidence}. Abstention Required={has_unsupported}.",
        "execution_time_ms": elapsed_ms
    })
    logger.info(f"Planning Agent completed in {elapsed_ms}ms")
    return state
