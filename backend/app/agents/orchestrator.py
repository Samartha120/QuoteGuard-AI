"""Supervisor orchestrator for the QuoteGuard agents (LangGraph).

The old workflow called the five agents in a fixed order. Here a supervisor node
runs between every agent: it looks at what the last agent produced and decides
which agent goes next, so the route depends on the RFQ:

    START -> supervisor -> <agent> -> supervisor -> <agent> -> ... -> finish | escalate

How a decision is made
  1. `legal_moves()` lists the moves that make sense from the current state
     (e.g. no drafting before extraction, re-search only while the retry budget
     lasts). This is the guardrail — the LLM can never pick an illegal move.
  2. If there is only one legal move it is taken ("forced").
  3. If there are several, the LLM chooses one and gives a reason ("llm").
     When no LLM is available, or its answer is not one of the legal moves,
     the first legal move is taken ("policy").

Every handoff is written to `state.messages` and every decision, with its reason
and who made it, to `state.orchestrator_decisions`. Together they are the
execution trace.

An agent that raises does not crash the run: the error is recorded, the
supervisor retries it, and escalates to a human once the retry budget is spent.
"""
import json
import time
from typing import Callable, Dict, List, Optional, Tuple

from langgraph.graph import END, START, StateGraph

from app.agents.state import AgentState
from app.agents.requirement_agent import run_requirement_agent
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.planning_agent import run_planning_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.drafting_agent import run_drafting_agent
from app.tools.pricing_catalog import approved_grades
from app.llm.client import llm_client
from app.llm.structured_output import clean_and_parse_json
from app.core.config import settings
from app.core.logging import logger

SUPERVISOR = "supervisor"
FINISH = "finish"
ESCALATE = "escalate"

# Pipeline order. Re-running an agent invalidates everything after it.
AGENT_ORDER = ["extraction", "retrieval", "planning", "validation", "drafting"]

DEFAULT_AGENTS: Dict[str, Callable[[AgentState], AgentState]] = {
    "extraction": run_requirement_agent,
    "retrieval": run_retrieval_agent,
    "planning": run_planning_agent,
    "validation": run_validation_agent,
    "drafting": run_drafting_agent,
}

AGENT_LABELS = {
    "extraction": "Requirement Extraction Agent",
    "retrieval": "Retrieval Agent",
    "planning": "Planning & Strategy Agent",
    "validation": "Validation Agent",
    "drafting": "Drafting Agent",
}

MAX_ATTEMPTS = 3        # runs per agent, including error retries
MAX_RETRIEVALS = 2      # how many times the supervisor may send retrieval back out
MAX_STEPS = 16          # supervisor decisions per RFQ, hard stop against loops

Move = Tuple[str, str]  # (next node, reason)


# --------------------------------------------------------------------------- #
# Reading the state
# --------------------------------------------------------------------------- #

def _norm_grade(grade: str) -> str:
    return "".join(str(grade).upper().split())


def _line_items(state: AgentState) -> list:
    return state.extracted_requirements.get("line_items", []) or []


def _weak_items(state: AgentState) -> Tuple[List[str], List[str]]:
    """Items below the grounding threshold, split by cause.

    A grade the catalogue does not stock cannot be fixed by searching again; a weak
    match on a stocked item might be."""
    grades = {_norm_grade(g) for g in approved_grades()}
    mismatch, weak_evidence = [], []
    for item in _line_items(state):
        name = item.get("product_name", "")
        conf = state.field_confidences.get(name)
        if conf is None or conf >= settings.GROUNDING_THRESHOLD:
            continue
        grade = item.get("material_grade")
        if grade and grades and _norm_grade(grade) not in grades:
            mismatch.append(name)
        else:
            weak_evidence.append(name)
    return mismatch, weak_evidence


def legal_moves(state: AgentState) -> List[Move]:
    """Moves that make sense from this state, preferred move first."""
    done = set(state.completed_agents)
    tries = state.attempts

    def run_or_escalate(agent: str, reason: str) -> List[Move]:
        if tries.get(agent, 0) >= MAX_ATTEMPTS:
            return [(ESCALATE, f"{AGENT_LABELS[agent]} failed {tries[agent]} times")]
        return [(agent, reason)]

    if state.step > MAX_STEPS:
        return [(ESCALATE, f"step budget of {MAX_STEPS} exhausted")]

    if "extraction" not in done:
        return run_or_escalate("extraction", "RFQ has not been read yet")

    if not _line_items(state):
        if tries.get("extraction", 0) < MAX_ATTEMPTS:
            return [("extraction", "extraction returned no line items; read the RFQ again"),
                    (ESCALATE, "no quotable line items found in the RFQ")]
        return [(ESCALATE, "no quotable line items found after repeated extraction")]

    if "retrieval" not in done:
        return run_or_escalate("retrieval", "line items need catalogue, pricing and policy evidence")

    if not state.retrieved_evidence and tries.get("retrieval", 0) < MAX_RETRIEVALS:
        return [("retrieval", "retrieval found no evidence; search again"),
                ("planning", "no evidence exists; let planning score it and abstain")]

    if "planning" not in done:
        return run_or_escalate("planning", "evidence is in; score grounding confidence")

    if "validation" not in done:
        mismatch, weak = _weak_items(state)
        reason = "confidence scored; verify each line item"
        if mismatch:
            reason += f" (grade not stocked for {mismatch}; searching again cannot fix that)"
        moves: List[Move] = []
        if weak and tries.get("retrieval", 0) < MAX_RETRIEVALS:
            moves.append(("retrieval", f"weak evidence for stocked item(s) {weak}; search again"))
        return moves + run_or_escalate("validation", reason)

    if "drafting" not in done:
        path = "clarification request" if state.abstention_required else "priced quotation"
        return run_or_escalate("drafting", f"items verified; draft the {path}")

    return [(FINISH, "draft is ready for human approval")]


def _summary(state: AgentState) -> dict:
    """What the supervisor LLM gets to see — small, factual, no raw RFQ text."""
    mismatch, weak = _weak_items(state)
    return {
        "completed_agents": state.completed_agents,
        "attempts": state.attempts,
        "line_items": [
            {
                "product": i.get("product_name"),
                "grade": i.get("material_grade"),
                "qty": i.get("quantity"),
                "confidence": state.field_confidences.get(i.get("product_name", "")),
            }
            for i in _line_items(state)
        ],
        "evidence_chunks": len(state.retrieved_evidence),
        "grounding_threshold": settings.GROUNDING_THRESHOLD,
        "grade_not_in_catalogue": mismatch,
        "weak_evidence_items": weak,
        "abstention_required": state.abstention_required,
        "last_message": state.messages[-1]["content"] if state.messages else None,
    }


# --------------------------------------------------------------------------- #
# Deciding
# --------------------------------------------------------------------------- #

SUPERVISOR_PROMPT = """You are the supervisor of a team of quotation agents. Decide which agent acts next.

Current state:
{summary}

You may choose ONLY one of these options:
{options}

Prefer re-searching only when it can plausibly find better evidence. A material grade
the catalogue does not stock cannot be fixed by searching again.

Reply with JSON only: {{"next": "<option>", "reason": "<one sentence>"}}"""


def _ask_llm(state: AgentState, moves: List[Move]) -> Optional[Move]:
    if not settings.ORCHESTRATOR_USE_LLM or llm_client.demo_mode:
        return None
    options = "\n".join(f"- {m}: {r}" for m, r in moves)
    prompt = SUPERVISOR_PROMPT.format(summary=json.dumps(_summary(state), indent=2), options=options)
    try:
        raw = llm_client.generate_completion(
            system_prompt="You route work between agents. Answer with JSON only.",
            user_prompt=prompt,
        )
    except Exception as e:  # pragma: no cover - the client already swallows most errors
        logger.warning(f"Supervisor LLM call failed: {e}")
        return None
    if llm_client.demo_mode:
        return None  # the client fell back to canned output mid-call; ignore it
    choice = clean_and_parse_json(raw)
    legal = {m for m, _ in moves}
    if choice.get("next") in legal:
        return choice["next"], str(choice.get("reason") or "").strip() or "chosen by supervisor LLM"
    logger.warning(f"Supervisor LLM picked an illegal move {choice.get('next')!r}; using policy")
    return None


def decide(state: AgentState) -> dict:
    moves = legal_moves(state)
    if len(moves) == 1:
        (nxt, reason), by = moves[0], "forced"
    else:
        picked = _ask_llm(state, moves)
        (nxt, reason), by = (picked, "llm") if picked else (moves[0], "policy")
    return {"next": nxt, "reason": reason, "decided_by": by, "options": [m for m, _ in moves]}


# --------------------------------------------------------------------------- #
# Graph nodes
# --------------------------------------------------------------------------- #

def _dump(state: AgentState) -> dict:
    return state.model_dump()


def supervisor_node(state: AgentState) -> dict:
    s = state.model_copy(deep=True)
    s.step += 1
    d = decide(s)
    nxt = d["next"]
    s.next_agent = nxt
    s.orchestrator_decisions.append({"step": s.step, **d})
    logger.info(f"[supervisor] step {s.step}: -> {nxt} ({d['decided_by']}) {d['reason']}")

    if nxt in AGENT_ORDER:
        s.attempts[nxt] = s.attempts.get(nxt, 0) + 1
        # re-running an agent makes its own and every later result stale
        stale = set(AGENT_ORDER[AGENT_ORDER.index(nxt):])
        s.completed_agents = [a for a in s.completed_agents if a not in stale]
        s.messages.append({"step": s.step, "from": SUPERVISOR, "to": nxt,
                           "type": "task", "content": d["reason"]})
    return _dump(s)


def make_agent_node(name: str, fn: Callable[[AgentState], AgentState]):
    def node(state: AgentState) -> dict:
        before = state.model_copy(deep=True)
        start = time.time()
        try:
            after = fn(state.model_copy(deep=True)) or before
        except Exception as e:
            # keep the pre-run state; record the failure and let the supervisor decide
            logger.error(f"{AGENT_LABELS[name]} raised: {e!r}")
            before.messages.append({"step": before.step, "from": name, "to": SUPERVISOR,
                                    "type": "error", "content": f"{type(e).__name__}: {e}"})
            before.agent_traces.append({
                "agent_name": AGENT_LABELS[name],
                "status": "FAILED",
                "output_summary": f"Attempt {before.attempts.get(name, 1)} failed: {type(e).__name__}: {e}",
                "execution_time_ms": int((time.time() - start) * 1000),
            })
            return _dump(before)

        after.completed_agents = after.completed_agents + [name]
        last = after.agent_traces[-1]["output_summary"] if after.agent_traces else "done"
        after.messages.append({"step": after.step, "from": name, "to": SUPERVISOR,
                               "type": "result", "content": last})
        return _dump(after)

    node.__name__ = f"{name}_node"
    return node


def escalate_node(state: AgentState) -> dict:
    """Hand the RFQ to a human. Produces a clarification draft the existing UI understands."""
    s = state.model_copy(deep=True)
    reason = s.orchestrator_decisions[-1]["reason"] if s.orchestrator_decisions else "unknown"
    s.abstention_required = True
    s.grounded_status = "ABSTAINED"
    s.escalation_notes = f"ESCALATED BY ORCHESTRATOR: {reason}. A sales engineer must review this RFQ."
    if not s.clarification_questions:
        s.clarification_questions = [f"Automated processing stopped: {reason}. Please review manually."]
    if not s.quotation_draft:
        s.quotation_draft = {
            "customer_name": s.customer_name,
            "subtotal": 0.0, "tax_amount": 0.0, "total_amount": 0.0,
            "status": "CLARIFICATION_REQUIRED",
            "line_items": [
                {"product_code": "UNVERIFIED", "product_name": i.get("product_name", ""),
                 "material_grade": i.get("material_grade") or "", "quantity": i.get("quantity", 1),
                 "unit_price": None, "total_price": None, "confidence_score": 0.0,
                 "status": "abstained", "citations": []}
                for i in _line_items(s)
            ],
        }
    s.messages.append({"step": s.step, "from": SUPERVISOR, "to": "human",
                       "type": "escalation", "content": reason})
    s.agent_traces.append({"agent_name": "Orchestrator", "status": "ESCALATED",
                           "output_summary": s.escalation_notes, "execution_time_ms": 0})
    return _dump(s)


def build_graph(agents: Optional[Dict[str, Callable[[AgentState], AgentState]]] = None):
    """Compile the supervisor graph. `agents` lets tests swap in fake agents."""
    agents = {**DEFAULT_AGENTS, **(agents or {})}
    g = StateGraph(AgentState)
    g.add_node(SUPERVISOR, supervisor_node)
    for name in AGENT_ORDER:
        g.add_node(name, make_agent_node(name, agents[name]))
        g.add_edge(name, SUPERVISOR)
    g.add_node(ESCALATE, escalate_node)

    g.add_edge(START, SUPERVISOR)
    g.add_conditional_edges(
        SUPERVISOR,
        lambda s: s.next_agent,
        {**{a: a for a in AGENT_ORDER}, ESCALATE: ESCALATE, FINISH: END},
    )
    g.add_edge(ESCALATE, END)
    return g.compile()


def run(initial_state: AgentState, agents=None) -> AgentState:
    graph = build_graph(agents)
    # each agent costs two graph steps (supervisor + agent); leave headroom over MAX_STEPS
    result = graph.invoke(initial_state, config={"recursion_limit": 2 * MAX_STEPS + 10})
    return AgentState.model_validate(result)
