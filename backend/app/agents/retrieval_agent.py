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


def _latest_retry_reason(state: AgentState) -> str | None:
    """Looks for the most recent task handoff addressed to retrieval in
    state.messages (written by the supervisor/critic when sending retrieval
    back for another attempt) and returns its reason text, or None on a
    first-ever run. See orchestrator.supervisor_node for the message shape:
    {"step", "from", "to": "retrieval", "type": "task", "content": "<reason>"}.
    """
    for msg in reversed(state.messages):
        if msg.get("to") == "retrieval" and msg.get("type") == "task":
            return msg.get("content")
    return None


def run_retrieval_agent(state: AgentState) -> AgentState:
    """Stage 2: Retrieval Agent - LLM-driven tool selection.

    Rather than calling every tool for every line item in a fixed loop, the
    agent first asks the LLM which tools are actually relevant for each item
    and what query to search with, then executes only that plan. Every tool
    call actually made (tool name, query, result count) is logged to
    state.tool_call_log so the execution trace shows real agent reasoning,
    not just a fixed sequence.

    When the supervisor or critic sends this agent back for a second pass,
    the reason for that (from state.messages) is folded into the planning
    prompt, so the LLM can change its queries rather than repeating the same
    search that already failed.
    """
    start_time = time.time()
    run_start_index = len(state.tool_call_log)  # calls already logged from earlier runs
    line_items = state.extracted_requirements.get("line_items", [])

    retry_reason = _latest_retry_reason(state)
    retry_context = (
        f"\nYOU ARE BEING ASKED TO TRY AGAIN. The previous attempt's evidence was "
        f"rejected for this reason: \"{retry_reason}\". Change your search queries "
        f"accordingly (e.g. try the product code instead of the name, a synonym, or "
        f"a broader term) rather than repeating the same search.\n"
        if retry_reason else "\n"
    )

    plan_prompt = RETRIEVAL_PLANNING_PROMPT.format(
        requirements_json=json.dumps(state.extracted_requirements),
        retry_context=retry_context,
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

    # Fix: payment/delivery terms must always be checked against policy —
    # the LLM was observed skipping this on RFQs that clearly needed it
    # (e.g. "Net 30", "90-day credit", a named delivery city/timeframe).
    # This guard overrides the LLM's needs_policy_lookup decision rather
    # than trusting it, since the cost of an unnecessary lookup is far
    # lower than the cost of silently skipping a policy check.
    reqs = state.extracted_requirements
    terms_present = bool(reqs.get("payment_terms") or reqs.get("delivery_terms"))
    needs_policy_lookup = plan.get("needs_policy_lookup", False) or terms_present
    if terms_present and not plan.get("needs_policy_lookup"):
        state.tool_call_log.append({
            "event": "POLICY_LOOKUP_FORCED",
            "reason": "payment_terms/delivery_terms present in RFQ; LLM plan had skipped the policy check"
        })

    evidence_list = []

    for item_plan in plan.get("item_plans", []):
        for call in item_plan.get("calls", []):
            tool_name = call.get("tool")
            query = call.get("query", "")
            tool_fn = TOOL_FUNCTIONS.get(tool_name)
            if tool_fn is None or not query:
                continue

            try:
                results = tool_fn(query)
            except Exception as e:
                # Fix: a failing tool call no longer crashes the whole agent.
                # Logged and skipped so the rest of the plan still runs.
                logger.error(f"Retrieval Agent: tool '{tool_name}' failed for query '{query}': {e!r}")
                state.tool_call_log.append({
                    "agent": "Retrieval Agent",
                    "tool": tool_name,
                    "query": query,
                    "for_item": item_plan.get("product_name", ""),
                    "error": f"{type(e).__name__}: {e}"
                })
                continue

            evidence_list.extend(results)
            state.tool_call_log.append({
                "agent": "Retrieval Agent",
                "tool": tool_name,
                "query": query,
                "for_item": item_plan.get("product_name", ""),
                "results_found": len(results)
            })

    if needs_policy_lookup:
        try:
            policy_evidence = get_delivery_policy()
        except Exception as e:
            logger.error(f"Retrieval Agent: get_delivery_policy failed: {e!r}")
            policy_evidence = []
            state.tool_call_log.append({
                "agent": "Retrieval Agent",
                "tool": "get_delivery_policy",
                "query": None,
                "for_item": None,
                "error": f"{type(e).__name__}: {e}"
            })
        else:
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

    # Fix: count only the tool calls made in THIS run, not earlier retry
    # attempts — tool_call_log persists across re-runs within the same RFQ.
    calls_this_run = len(state.tool_call_log) - run_start_index

    state.agent_traces.append({
        "agent_name": "Retrieval Agent",
        "status": "SUCCESS",
        "output_summary": (
            f"Executed {calls_this_run} LLM-selected tool call(s) this run"
            + (f" (retry: {retry_reason})" if retry_reason else "")
            + f", retrieving {len(unique_evidence)} unique evidence chunks."
        ),
        "execution_time_ms": elapsed_ms
    })
    logger.info(
        f"Retrieval Agent completed in {elapsed_ms}ms using {calls_this_run} tool calls this run"
    )
    return state
