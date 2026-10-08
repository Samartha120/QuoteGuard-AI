import time
from app.agents.state import AgentState
from app.llm.client import llm_client
from app.llm.prompts import SYSTEM_PROMPT, REQUIREMENT_EXTRACTION_PROMPT
from app.llm.structured_output import clean_and_parse_json
from app.tools.pricing_catalog import lookup_product
from app.core.logging import logger


def _backfill_product_codes(line_items):
    """The extraction prompt deliberately tells the LLM not to guess a product_code it
    isn't sure of, so line items often arrive with product_code=None (or, on a weaker
    model, a code that doesn't match any approved product). Resolve each item against the
    approved catalogue by product_name instead, so Retrieval and Validation & Planning get
    a real product_code to work with rather than searching on free-text name alone. Never
    invents a code: if the catalogue has no match either, the item is left as the LLM
    returned it, and later agents handle it as "missing"/"unverified" as before.
    """
    corrected = 0
    for item in line_items:
        code = (item.get("product_code") or "").strip()
        name = item.get("product_name") or ""
        row = lookup_product(product_code=code, product_name=name)
        if row and row["code"] != code:
            logger.info(
                f"Requirement Analysis Agent: resolved product_code for '{name}' "
                f"({code or 'missing'} -> {row['code']}) via catalogue lookup"
            )
            item["product_code"] = row["code"]
            corrected += 1
    return corrected


def run_requirement_agent(state: AgentState) -> AgentState:
    """Stage 1: Requirement Analysis Agent.

    Turns the RFQ's free text into structured line items and commercial terms. The LLM is
    told not to guess a product_code it can't read directly off the RFQ; this agent then
    resolves (or corrects) each item's product_code against the approved catalogue itself,
    so a vaguely-worded RFQ or a near-miss code from the LLM doesn't silently propagate into
    Retrieval's search queries and the final quotation.
    """
    start_time = time.time()
    user_prompt = REQUIREMENT_EXTRACTION_PROMPT.format(rfq_text=state.raw_text)

    raw_response = llm_client.generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    parsed = clean_and_parse_json(raw_response)
    line_items = parsed.get("line_items", [])
    corrected = _backfill_product_codes(line_items)

    state.extracted_requirements = parsed
    if parsed.get("customer_name"):
        state.customer_name = parsed["customer_name"]
    if parsed.get("customer_email"):
        state.customer_email = parsed["customer_email"]

    elapsed_ms = int((time.time() - start_time) * 1000)

    summary = f"Extracted {len(line_items)} line items and commercial terms for {state.customer_name}"
    if corrected:
        summary += f"; resolved {corrected} product code(s) against the approved catalogue"

    state.agent_traces.append({
        "agent_name": "Requirement Analysis Agent",
        "status": "SUCCESS",
        "output_summary": summary,
        "execution_time_ms": elapsed_ms
    })
    logger.info(f"Requirement Analysis Agent completed in {elapsed_ms}ms")
    return state
