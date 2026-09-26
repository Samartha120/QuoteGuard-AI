import time
from app.agents.state import AgentState
from app.tools.catalogue_tool import search_catalogue
from app.tools.pricing_tool import lookup_price
from app.tools.document_tool import get_delivery_policy
from app.core.logging import logger

def run_retrieval_agent(state: AgentState) -> AgentState:
    """Stage 2: Retrieval Agent - Tool Calling Engine."""
    start_time = time.time()
    evidence_list = []
    line_items = state.extracted_requirements.get("line_items", [])
    
    for item in line_items:
        p_name = item.get("product_name", "")
        p_code = item.get("product_code") or p_name
        
        # Call tool: search catalogue specs
        cat_evidence = search_catalogue(product_query=f"{p_name} {p_code}")
        evidence_list.extend(cat_evidence)
        
        # Call tool: lookup pricing
        price_evidence = lookup_price(product_code=p_code)
        evidence_list.extend(price_evidence)

    # Call tool: get delivery and credit policy
    policy_evidence = get_delivery_policy()
    evidence_list.extend(policy_evidence)

    # Deduplicate retrieved evidence by chunk_id
    seen_ids = set()
    unique_evidence = []
    for ev in evidence_list:
        cid = ev.get("chunk_id")
        if cid not in seen_ids:
            seen_ids.add(cid)
            unique_evidence.append(ev)

    state.retrieved_evidence = unique_evidence
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    state.agent_traces.append({
        "agent_name": "Retrieval Agent",
        "status": "SUCCESS",
        "output_summary": f"Retrieved {len(unique_evidence)} verified knowledge base evidence chunks across catalog, pricing, and policy sources.",
        "execution_time_ms": elapsed_ms
    })
    logger.info(f"Retrieval Agent completed in {elapsed_ms}ms")
    return state
