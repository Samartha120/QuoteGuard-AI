"""Tests for the Retrieval Agent's own logic (tool selection, re-search on
retry, the forced policy-lookup guard, and graceful handling of a failing
tool) — using fake tools and a fake LLM response so these run without a real
vector store or LLM, matching how test_orchestrator.py tests routing with
fake agents."""
import json
from unittest.mock import patch

import pytest

from app.agents import retrieval_agent
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.state import AgentState
from app.llm.client import LLMUnavailableError


def _fake_plan(needs_policy_lookup, item_plans):
    return json.dumps({"needs_policy_lookup": needs_policy_lookup, "item_plans": item_plans})


def _state(line_items, payment_terms=None, delivery_terms=None):
    return AgentState(
        rfq_id="t",
        raw_text="test",
        extracted_requirements={
            "line_items": line_items,
            "payment_terms": payment_terms,
            "delivery_terms": delivery_terms,
        },
    )


def test_calls_only_the_tools_the_plan_selects():
    """The agent should execute exactly the LLM's plan, not every tool for
    every item (the fixed-loop behavior this replaced)."""
    plan = _fake_plan(
        needs_policy_lookup=False,
        item_plans=[{"product_name": "IV-200", "calls": [{"tool": "search_catalogue", "query": "IV-200"}]}],
    )
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])

    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value=plan), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [{"chunk_id": "c1", "content": f"match for {q}"}],
             "lookup_price": lambda q: [{"chunk_id": "c2", "content": f"price for {q}"}],
         }):
        result = run_retrieval_agent(state)

    tools_called = [c["tool"] for c in result.tool_call_log if "tool" in c]
    assert tools_called == ["search_catalogue"]
    assert "lookup_price" not in tools_called


def test_forces_policy_lookup_when_llm_skips_it_despite_terms_present():
    """Reproduces the reported bug: the LLM says needs_policy_lookup=False
    even though payment_terms is set. The agent must call the policy tool
    anyway and log that it overrode the LLM's decision."""
    plan = _fake_plan(needs_policy_lookup=False, item_plans=[
        {"product_name": "IV-200", "calls": [{"tool": "search_catalogue", "query": "IV-200"}]}
    ])
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}],
                    payment_terms="Net 30 days")

    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value=plan), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [],
         }), \
         patch("app.agents.retrieval_agent.get_delivery_policy", return_value=[{"chunk_id": "p1", "content": "policy"}]) as mock_policy:
        result = run_retrieval_agent(state)

    mock_policy.assert_called_once()
    forced = [c for c in result.tool_call_log if c.get("event") == "POLICY_LOOKUP_FORCED"]
    assert len(forced) == 1


def test_failing_tool_is_logged_not_raised():
    """A tool that raises should not crash the agent; it should be logged
    to tool_call_log with the error, and the rest of the plan still runs."""
    plan = _fake_plan(needs_policy_lookup=False, item_plans=[
        {"product_name": "IV-200", "calls": [
            {"tool": "search_catalogue", "query": "IV-200"},
            {"tool": "lookup_price", "query": "IV-200"},
        ]}
    ])
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])

    def broken_search(q):
        raise ConnectionError("vector store unreachable")

    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value=plan), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": broken_search,
             "lookup_price": lambda q: [{"chunk_id": "c2", "content": "price"}],
         }):
        result = run_retrieval_agent(state)  # must not raise

    errored = [c for c in result.tool_call_log if "error" in c]
    assert len(errored) == 1
    assert "ConnectionError" in errored[0]["error"]
    # the second (working) tool call should still have gone through
    succeeded = [c for c in result.tool_call_log if c.get("tool") == "lookup_price" and "error" not in c]
    assert len(succeeded) == 1


def test_resends_retry_reason_into_the_planning_prompt():
    """When the supervisor/critic has sent retrieval back (a 'task' message
    addressed to retrieval in state.messages), the agent must put that
    reason into the prompt it sends the LLM, so a second pass can search
    differently instead of repeating the same query."""
    plan = _fake_plan(needs_policy_lookup=False, item_plans=[])
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])
    state.messages.append({
        "step": 1, "from": "supervisor", "to": "retrieval", "type": "task",
        "content": "weak evidence for stocked item(s) [IV-200]; search again",
    })

    captured_prompts = []

    def capture_and_return(system_prompt, user_prompt):
        captured_prompts.append(user_prompt)
        return plan

    with patch.object(retrieval_agent.llm_client, "generate_completion", side_effect=capture_and_return):
        run_retrieval_agent(state)

    assert len(captured_prompts) == 1
    assert "weak evidence for stocked item(s) [IV-200]; search again" in captured_prompts[0]


def test_tool_call_count_excludes_earlier_runs():
    """tool_call_log persists across re-runs of the same AgentState (the
    supervisor re-invokes the agent in place). The trace summary for THIS
    run must count only calls made in this run, not earlier attempts."""
    plan = _fake_plan(needs_policy_lookup=False, item_plans=[
        {"product_name": "IV-200", "calls": [{"tool": "search_catalogue", "query": "IV-200"}]}
    ])
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])

    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value=plan), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [{"chunk_id": "c1", "content": "m"}],
         }):
        # First run
        state = run_retrieval_agent(state)
        assert "1 LLM-selected tool call(s) this run" in state.agent_traces[-1]["output_summary"]

        # Second run (simulating a supervisor retry) on the SAME state object,
        # so tool_call_log now carries over the first run's entry too.
        state.messages.append({"step": 2, "from": "supervisor", "to": "retrieval",
                               "type": "task", "content": "search again"})
        state = run_retrieval_agent(state)

    assert len(state.tool_call_log) == 2  # both runs' calls accumulated
    assert "1 LLM-selected tool call(s) this run" in state.agent_traces[-1]["output_summary"]


def test_falls_back_to_default_plan_when_llm_plan_is_unparseable():
    """When the LLM's planning response isn't usable JSON with item_plans
    (clean_and_parse_json returns {"error": ..., "raw": ...}), the agent must
    not fail the whole RFQ: it falls back to calling both tools for every
    line item, and logs a FALLBACK event so the degradation is visible in
    the trace rather than silent."""
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])

    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value="not valid json at all"), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [{"chunk_id": "c1", "content": f"catalogue match for {q}"}],
             "lookup_price": lambda q: [{"chunk_id": "c2", "content": f"price for {q}"}],
         }):
        result = run_retrieval_agent(state)

    fallback_events = [c for c in result.tool_call_log if c.get("event") == "FALLBACK"]
    assert len(fallback_events) == 1
    assert "unparseable" in fallback_events[0]["reason"] or "empty" in fallback_events[0]["reason"]

    # the default plan calls both tools, using the product name + code as the query
    tools_called = [c["tool"] for c in result.tool_call_log if "tool" in c]
    assert "search_catalogue" in tools_called
    assert "lookup_price" in tools_called
    assert len(result.retrieved_evidence) == 2  # one chunk from each tool call


def test_deduplicates_evidence_by_chunk_id_across_calls():
    """Different tool calls (e.g. two line items, or a retry) can return
    overlapping evidence chunks. state.retrieved_evidence must contain each
    chunk_id only once, even though every individual tool call is still
    logged in tool_call_log."""
    plan = _fake_plan(needs_policy_lookup=False, item_plans=[
        {"product_name": "IV-200", "calls": [
            {"tool": "search_catalogue", "query": "IV-200"},
            {"tool": "lookup_price", "query": "IV-200"},
        ]},
        {"product_name": "PV-100", "calls": [
            {"tool": "search_catalogue", "query": "PV-100"},
        ]},
    ])
    state = _state([
        {"product_name": "Industrial Valve", "product_code": "IV-200"},
        {"product_name": "Pressure Relief Valve", "product_code": "PV-100"},
    ])

    # search_catalogue returns the SAME chunk ("shared") for both queries, simulating
    # two different searches landing on overlapping catalogue content.
    with patch.object(retrieval_agent.llm_client, "generate_completion", return_value=plan), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [{"chunk_id": "shared", "content": "catalogue page"}],
             "lookup_price": lambda q: [{"chunk_id": "price-1", "content": "price row"}],
         }):
        result = run_retrieval_agent(state)

    # 3 tool calls were made (2 for IV-200, 1 for PV-100), but "shared" should
    # only appear once in retrieved_evidence.
    assert len([c for c in result.tool_call_log if "tool" in c]) == 3
    chunk_ids = [e["chunk_id"] for e in result.retrieved_evidence]
    assert chunk_ids.count("shared") == 1
    assert sorted(chunk_ids) == ["price-1", "shared"]


def test_falls_back_to_default_plan_when_the_llm_is_unavailable():
    """Since #7, llm_client.generate_completion raises LLMUnavailableError
    instead of returning canned text when no model answers. The default plan
    needs no LLM at all, so an unavailable LLM should not fail the whole RFQ
    — the agent should catch the error and use the default plan, the same as
    it does for an empty/unparseable plan."""
    state = _state([{"product_name": "Industrial Valve", "product_code": "IV-200"}])

    with patch.object(retrieval_agent.llm_client, "generate_completion",
                       side_effect=LLMUnavailableError("provider down")), \
         patch.object(retrieval_agent, "TOOL_FUNCTIONS", {
             "search_catalogue": lambda q: [{"chunk_id": "c1", "content": f"catalogue match for {q}"}],
             "lookup_price": lambda q: [{"chunk_id": "c2", "content": f"price for {q}"}],
         }):
        result = run_retrieval_agent(state)  # must not raise

    fallback_events = [c for c in result.tool_call_log if c.get("event") == "FALLBACK"]
    assert len(fallback_events) == 1
    tools_called = [c["tool"] for c in result.tool_call_log if "tool" in c]
    assert "search_catalogue" in tools_called
    assert "lookup_price" in tools_called
