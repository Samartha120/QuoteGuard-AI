import time
from app.agents.state import AgentState
from app.llm.client import llm_client
from app.llm.prompts import SYSTEM_PROMPT, REQUIREMENT_EXTRACTION_PROMPT
from app.llm.structured_output import clean_and_parse_json
from app.core.logging import logger

def run_requirement_agent(state: AgentState) -> AgentState:
    """Stage 1: Requirement Extraction Agent."""
    start_time = time.time()
    user_prompt = REQUIREMENT_EXTRACTION_PROMPT.format(rfq_text=state.raw_text)
    
    raw_response = llm_client.generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt
    )
    
    parsed = clean_and_parse_json(raw_response)
    state.extracted_requirements = parsed
    if parsed.get("customer_name"):
        state.customer_name = parsed["customer_name"]
    if parsed.get("customer_email"):
        state.customer_email = parsed["customer_email"]

    elapsed_ms = int((time.time() - start_time) * 1000)
    
    state.agent_traces.append({
        "agent_name": "Requirement Extraction Agent",
        "status": "SUCCESS",
        "output_summary": f"Extracted {len(parsed.get('line_items', []))} line items and commercial terms for {state.customer_name}",
        "execution_time_ms": elapsed_ms
    })
    logger.info(f"Requirement Extraction Agent completed in {elapsed_ms}ms")
    return state
