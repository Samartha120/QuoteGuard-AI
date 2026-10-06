# QuoteGuard AI — Design Document (Section B)

**Team:** AXION AI
**Author of this document:** Atharva Kulkarni
**Covers:** architecture diagram, agent roles, orchestration pattern & rationale, why LangGraph.
For input/output JSON schemas and a real captured sample run, see `docs/IO_SCHEMAS.md`.

---

## 1. Architecture Diagram

QuoteGuard AI processes one RFQ (request for quotation) through **four specialist agents**,
coordinated by a **supervisor** that decides which agent runs next, with a **critic** that
reviews every draft before a human sees it. This is not a fixed pipeline — the route taken
depends on the RFQ itself.

```
                                   +------------------+
                         +-------->|    SUPERVISOR    |<--------+
                         |         |  (orchestrator)  |         |
                         |         +---------+--------+         |
                         |                   |                  |
                         |   decide():  legal_moves(state)       |
                         |   -> 1 move  = forced                 |
                         |   -> >1 move = LLM picks (or policy)  |
                         |                   |                  |
         task  +---------v----------+   task v                  | task
      (handoff)|                    |  (handoff)                | (handoff)
                v                   v                            v
        +-------+------+   +--------+-------+   +----------------+------+
        | 1. Requirement|   | 2. Retrieval  |   | 3. Validation &       |
        |    Analysis   |   |    Agent      |   |    Planning Agent     |
        |    Agent      |-->| tools:        |-->| - grounding confidence|
        | (extracts RFQ |   |  search_      |   |   per field (>=0.80)  |
        |  -> structured|   |  catalogue()  |   | - rule checks         |
        |  JSON)        |   |  lookup_price()|  | - LLM: missing /      |
        +-------+-------+   |  get_delivery_|   |   conflicting /       |
                |           |  policy()     |   |   ambiguous           |
                | result    +-------+-------+   | decision: proceed /   |
                v                   | result     |   clarify / escalate  |
         (back to SUPERVISOR)       v            +-----------+-----------+
                             (back to SUPERVISOR)             | result
                                                                v
                                                     (back to SUPERVISOR)
                                                                |
                                                                v task
                                                   +------------+-----------+
                                                   | 4. Quotation &         |
                                                   |    Communication Agent |
                                                   | ("Drafting Agent")     |
                                                   | - grounded -> priced,  |
                                                   |   cited quotation      |
                                                   | - abstained -> clarify-|
                                                   |   ation / escalation   |
                                                   +------------+-----------+
                                                                | result
                                                                v
                                                     (back to SUPERVISOR)
                                                                |
                                                                v task
                                                        +-------+--------+
                                                        |  CRITIC AGENT  |
                                                        | rule checks    |
                                                        | (arithmetic,   |
                                                        |  catalogue,    |
                                                        |  citations) +  |
                                                        | LLM review     |
                                                        | (policy terms, |
                                                        |  ignored asks) |
                                                        +-------+--------+
                                                                | verdict
                                     +--------------------------+-------------------------+
                                     | approve                                            | revise
                                     v                                                     v
                           validation_plan           (back to SUPERVISOR: re-route to
                           == escalate?                retrieval or drafting, whichever
                             |        |                the critic's fix_by names, up to
                       yes   |        | no              MAX_REVISIONS=2 rounds; unchanged
                             v        v                 draft or budget used up -> ESCALATE)
                       +-----+--------+-----+
                       | ESCALATE            |   FINISH
                       | (sales engineer     |   (ready for human
                       |  must review)       |    approval -> PDF)
                       +---------------------+---+------------------+
```

**Legend / reading the diagram:** every arrow into or out of an agent box actually passes
through the SUPERVISOR (the straight agent-to-agent arrows above are drawn only to save space —
in the real LangGraph graph, every edge is `<agent> -> supervisor -> <next agent>`). The
supervisor is the only node with branching logic about *which* agent runs next; the agents
themselves never call each other directly.

---

## 2. Agent Roles

| # | Agent | Role | Reads | Writes |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Requirement Analysis Agent** | Turns unstructured RFQ text into structured data | `raw_text` | `extracted_requirements`, `customer_name`, `customer_email` |
| 2 | **Retrieval Agent** | Finds the evidence (catalogue, pricing, policy) needed to ground each line item; LLM plans *which* tools to call, not a fixed loop | `extracted_requirements` | `retrieved_evidence`, `tool_call_log` |
| 3 | **Validation & Planning Agent** | Scores grounding confidence, finds missing/conflicting/ambiguous requirements, decides whether the RFQ can be quoted, needs customer clarification, or needs internal escalation | `extracted_requirements`, `retrieved_evidence` | `field_confidences`, `grounded_status`, `overall_confidence`, `abstention_required`, `validation_plan` |
| 4 | **Quotation & Communication Agent** ("Drafting Agent") | Produces the customer-facing artifact: a priced, cited quotation, or a clarification/escalation request | `validation_plan`, `extracted_requirements`, `retrieved_evidence` | `quotation_draft`, `clarification_questions`, `escalation_notes` |
| — | **Critic Agent** | Independently reviews the draft — deterministic rule checks an LLM is never trusted with, plus an evidence-grounded LLM review for judgement calls rules can't make | `quotation_draft`, `retrieved_evidence`, policy text | `critic_feedback` |
| — | **Supervisor / Orchestrator** | Decides which of the four agents (or the critic, or escalation) runs next, from the current state; the only place branching logic for the *route* lives | all of `AgentState` | `messages`, `orchestrator_decisions`, `completed_agents`, `attempts`, `next_agent`, `step` |

The four specialist agents plus the critic map onto the roles in the team's approved proposal
("4 agents"); the critic is the one addition beyond the original proposal, added specifically to
catch drafting mistakes (bad arithmetic, invented prices, ignored customer terms) before a human
reviewer ever sees them.

---

## 3. Orchestration Pattern — and why

**Pattern: Supervisor (router) with a state machine's guardrails, plus a reviewer-in-the-loop
(the critic).** Concretely:

- A **single shared state object** (`AgentState`, a Pydantic model) is passed through every node;
  agents read and write fields on it rather than passing messages to each other directly.
- A **supervisor node** runs between every agent call. It never contains business logic about
  *how* to extract requirements or *how* to price a line item — only about *which* agent should
  act next given what the state currently shows.
- The supervisor's `legal_moves(state)` function is a **hard guardrail**, computed in plain
  Python: it is impossible for the supervisor (or the LLM helping it decide) to pick a move that
  doesn't make sense (e.g. drafting before extraction has run, or re-entering retrieval once its
  retry budget is spent). The LLM is only ever asked to pick among moves that are *already* legal,
  and only when there's more than one legal option worth choosing between.
- A **critic** sits after drafting, as an independent reviewer rather than a bolt-on validation
  step — it can send work *back* to retrieval or drafting with specific, evidence-checked reasons,
  not just approve/reject.

**Why a supervisor-routed graph instead of a fixed 5-stage pipeline (the old design):**

1. **The right next step genuinely depends on the RFQ, not on a fixed position in a sequence.**
   A clean, fully-stocked RFQ should go `extraction -> retrieval -> validation -> drafting ->
   critic -> finish` in one pass. An RFQ with a non-stocked material grade should be stopped
   *before* a priced draft is attempted. An RFQ where retrieval came back thin should be retried
   — but only up to a budget, and only when retrying can plausibly help (a missing catalogue grade
   cannot be fixed by searching again; weak evidence for a stocked item might be). A fixed pipeline
   cannot express any of this without each stage secretly knowing about every other stage.
2. **Retries and revisions need a place to live that isn't inside the agents themselves.** When
   the critic finds a problem, *something* has to decide whether retrieval should run again,
   drafting should redo its work, or the problem is a human's to solve. Putting that decision in
   the supervisor keeps every individual agent simple (it does its one job and reports back)
   instead of each agent needing its own retry/escalation logic.
3. **Auditability for an abstention-first system.** Because the supervisor's decision and its
   reason are recorded on every single step (`state.orchestrator_decisions`), the full reasoning
   trace of *why* an RFQ was escalated or approved is reconstructable after the fact — not just
   the final output. This matters specifically because QuoteGuard AI's core promise is to **never
   silently hallucinate a commercial fact**; being able to show *exactly* which agent flagged
   what, and why the supervisor routed the way it did, is itself part of the product's trust
   story (see the real captured trace in `docs/IO_SCHEMAS.md`).
4. **Safety against infinite loops is explicit, not accidental.** `MAX_ATTEMPTS`, `MAX_RETRIEVALS`,
   `MAX_REVISIONS` and `MAX_STEPS` are all enforced in one place (`legal_moves` / `decide`), so a
   misbehaving LLM call can never spin the system forever — it is guaranteed to reach `ESCALATE`
   or `FINISH` within a bounded number of steps.

---

## 4. Why LangGraph

The supervisor pattern above is implemented as a LangGraph `StateGraph[AgentState]`
(`build_graph()` in `backend/app/agents/orchestrator.py`). LangGraph was chosen over a hand-rolled
`while` loop or a plain function-calling agent loop for three concrete reasons that match what the
project actually needed:

1. **A typed, shared state object is a first-class citizen.** LangGraph graphs operate directly
   on a state schema (here, the existing Pydantic `AgentState`) rather than forcing conversion
   to/from a chat-message list. Every agent node is a plain function `AgentState -> AgentState`
   (via `model_dump()`), which let the team keep its existing Pydantic agents almost unchanged
   when moving from the old fixed pipeline to the supervisor pattern.
2. **Conditional edges map exactly onto "the supervisor decides the next node."**
   `add_conditional_edges(SUPERVISOR, lambda s: s.next_agent, {...})` is a direct, declarative
   expression of the routing table (`extraction` / `retrieval` / `validation_planning` /
   `drafting` / `critic` / `ESCALATE` / `FINISH`) — the alternative (nested `if/elif` chains
   calling agents manually) is exactly the kind of implicit, hard-to-audit control flow this
   project is trying to avoid in its *domain* logic (hallucinated commercial facts), so it made
   little sense to accept it in the *orchestration* logic either.
3. **A built-in recursion/step limit for free.** The graph is invoked with
   `config={"recursion_limit": 2 * MAX_STEPS + 10}`, giving a hard backstop against runaway loops
   on top of the project's own `MAX_STEPS` check — important for a supervisor that is allowed to
   re-enter the same node (retrieval, drafting) more than once.
4. **Swappable nodes for testing.** `build_graph(agents=...)` accepts a dict to override any
   agent's implementation, which is how the test suite exercises specific supervisor routing
   decisions (e.g. forcing a "weak evidence" result) without needing a real LLM call in every test.

LangGraph was *not* used as a prompt-orchestration or multi-agent chat framework (there are no
agent-to-agent conversations) — only for its graph/state-machine primitives, which is exactly the
piece of LangGraph this project needed and nothing more.
