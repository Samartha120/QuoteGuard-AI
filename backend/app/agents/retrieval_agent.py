import time
import json
from app.agents.state import AgentState
from app.llm.client import llm_client
from app.llm.prompts import SYSTEM_PROMPT, RETRIEVAL_PLANNING_PROMPT
from app.llm.structured_output import clean_and_parse_json
from app.tools.catalogue_tool import search_catalogue
from app.tools.pricing_tool import lookup_price
from app.tools.document_tool import get_delivery_policy
from app.core.logging import logger

TOOL_FUNCTIONS = {
    "search_catalogue": lambda query: search_catalogue(product_query=query),
    "lookup_price": lambda query: lookup_price(product_code=query),
}


def _default_plan(line_items):
    """Fallback plan used only if the LLM's plan can't be parsed, so the agent
    degrades gracefully (calls both tools for every item) instead of failing
    the whole RFQ. Every use of this fallback is logged, never silent."""
    item_plans = []
    for item in line_items:
        p_name = item.get("product_name", "")
        p_code = item.get("product_code") or p_name
        item_plans.append({
            "product_name": p_name,
            "calls": [
                {"tool": "search_catalogue", "query": f"{p_name} {p_code}".strip()},
                {"tool": "lookup_price", "query": p_code},
            ]
        })
    return {"needs_policy_lookup": True, "item_plans": item_plans}


def run_retrieval_agent(state: AgentState) -> AgentState:
    """Stage 2: Retrieval Agent - LLM-driven tool selection.

    Rather than calling every tool for every line item in a fixed loop, the
    agent first asks the LLM which tools are actually relevant for each item
    and what query to search with, then executes only that plan. Every tool
    call actually made (tool name, query, result count) is logged to
    state.tool_call_log so the execution trace shows real agent reasoning,
    not just a fixed sequence.
    """
    start_time = time.time()
    line_items = state.extracted_requirements.get("line_items", [])

    plan_prompt = RETRIEVAL_PLANNING_PROMPT.format(
        requirements_json=json.dumps(state.extracted_requirements)
    )
    raw_plan = llm_client.generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=plan_prompt
    )
    plan = clean_and_parse_json(raw_plan)

    if not plan.get("item_plans"):
        logger.warning(
            "Retrieval Agent: LLM retrieval plan was empty or unparseable; "
            "falling back to a default search strategy for this RFQ."
        )
        plan = _default_plan(line_items)
        state.tool_call_log.append({
            "event": "FALLBACK",
            "reason": "LLM retrieval plan was empty or unparseable"
        })

    evidence_list = []

    for item_plan in plan.get("item_plans", []):
        for call in item_plan.get("calls", []):
            tool_name = call.get("tool")
            query = call.get("query", "")
            tool_fn = TOOL_FUNCTIONS.get(tool_name)
            if tool_fn is None or not query:
                continue

            results = tool_fn(query)
            evidence_list.extend(results)

            state.tool_call_log.append({
                "agent": "Retrieval Agent",
                "tool": tool_name,
                "query": query,
                "for_item": item_plan.get("product_name", ""),
                "results_found": len(results)
            })

    if plan.get("needs_policy_lookup"):
        policy_evidence = get_delivery_policy()
        evidence_list.extend(policy_evidence)
        state.tool_call_log.append({
            "agent": "Retrieval Agent",
            "tool": "get_delivery_policy",
            "query": None,
            "for_item": None,
            "results_found": len(policy_evidence)
        })

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
        "output_summary": (
            f"Executed {len(state.tool_call_log)} LLM-selected tool call(s), "
            f"retrieving {len(unique_evidence)} unique evidence chunks."
        ),
        "execution_time_ms": elapsed_ms
    })
    logger.info(
        f"Retrieval Agent completed in {elapsed_ms}ms using {len(state.tool_call_log)} tool calls"
    )
    return state
