# QuoteGuard AI — Agentic Workflow Architecture

**Team:** AXION AI
**Product:** QuoteGuard AI

---

## Supervisor-Routed Agent Graph (current)

QuoteGuard AI no longer runs its agents in a fixed order. A **supervisor node** sits between every
agent call and decides which agent runs next, based on the current `AgentState` — so the route an
RFQ takes depends on what has actually happened to it, not on a hard-coded stage number. This is
implemented as a LangGraph `StateGraph` in `backend/app/agents/orchestrator.py`.

```
START
  |
  v
+------------+
| SUPERVISOR |<-------------------------------------------------------+
+-----+------+                                                        |
      | decide() picks one legal move                                 |
      | (forced / llm / policy — see below)                           |
      |                                                                |
      +--> extraction -----------------------------> SUPERVISOR -------+
      |     (Requirement Analysis Agent)
      |
      +--> retrieval -------------------------------> SUPERVISOR -------+
      |     (Retrieval Agent: search_catalogue,                        |
      |      lookup_price, get_delivery_policy)                        |
      |     <-- can be re-entered (max 2x) if evidence is weak --------+
      |
      +--> validation_planning ----------------------> SUPERVISOR -------+
      |     (grounding scores + rule/LLM issue checks;                  |
      |      decision = proceed | clarify | escalate)                   |
      |
      +--> drafting ---------------------------------> SUPERVISOR -------+
      |     (Quotation & Communication Agent: priced                    |
      |      draft OR clarification/escalation draft)                   |
      |
      +--> critic ------------------------------------> SUPERVISOR -------+
      |     (rule checks + LLM review; verdict =              |
      |      approve | revise)                                |
      |         "revise" --> back to retrieval or drafting ---+
      |                      (max 2 revision rounds)
      |
      +--> ESCALATE --> END   (a sales engineer must review)
      |
      +--> FINISH --> END     (critic approved; ready for human approval)
```

### How the supervisor decides (`orchestrator.decide`)

1. **`legal_moves(state)`** computes the moves that make sense from the current state (e.g. you
   cannot draft before extraction has run; retrieval can only be re-entered while its retry budget
   remains). This is the hard guardrail — no LLM call can ever produce an illegal move.
2. If there is exactly **one** legal move, it is taken — `decided_by: "forced"`.
3. If there is more than one, an **LLM chooses** among the legal moves and gives a one-sentence
   reason — `decided_by: "llm"`. If no LLM is configured (demo mode), or the LLM's answer is not
   one of the legal options, the first legal move is taken instead — `decided_by: "policy"`.

Every handoff is appended to `state.messages` and every routing decision (with its reason and who
made it) to `state.orchestrator_decisions`; together these are the full execution trace shown in
the UI and used for the "real sample" in `docs/IO_SCHEMAS.md`.

### Retry, revision and escalation budgets

| Budget | Constant | Effect when exhausted |
| :--- | :--- | :--- |
| Attempts per agent (incl. errors) | `MAX_ATTEMPTS = 3` | Escalate, citing the agent's last error |
| Retrieval re-entries | `MAX_RETRIEVALS = 2` | Validation & Planning / drafting proceed with whatever evidence exists |
| Critic revision rounds | `MAX_REVISIONS = 2` | Escalate with the critic's remaining issues |
| Supervisor decisions per RFQ | `MAX_STEPS = 20` | Hard stop against infinite loops; escalate |

An agent that raises an exception does not crash the run — `make_agent_node` catches it, records
the error on `state.messages`/`state.agent_traces`, and lets the supervisor decide whether to
retry or escalate.

---

## Agent Specifications

### 1. Requirement Analysis Agent (`requirement_agent.py`)
- **Input**: Raw RFQ text (`state.raw_text`).
- **Tools**: None — single LLM extraction call.
- **Output**: `state.extracted_requirements` — customer name/email, `line_items[]` (product name,
  code, spec, material grade, quantity), `payment_terms`, `delivery_terms`.

### 2. Retrieval Agent (`retrieval_agent.py`)
- **Input**: `state.extracted_requirements`.
- **Logic**: an LLM first plans *which* tools to call per line item (not a fixed loop over every
  tool); the agent then executes only that plan.
- **Tools called**: `search_catalogue(query)`, `lookup_price(product_code)`,
  `get_delivery_policy()` (forced whenever payment/delivery terms are present, even if the LLM's
  plan skipped it).
- **Output**: `state.retrieved_evidence[]` (deduplicated by `chunk_id`) and a per-call
  `state.tool_call_log[]` entry (tool, query, item, result count or error).
- **Retry behaviour**: when re-entered by the supervisor, the reason for the retry (from
  `state.messages`) is folded into the planning prompt so the LLM changes its query instead of
  repeating a search that already failed.

### 3. Validation & Planning Agent (`validation_planning_agent.py`)
- **Input**: `state.extracted_requirements` + `state.retrieved_evidence`.
- **Logic**: (1) per-field grounding confidence vs. `GROUNDING_THRESHOLD = 0.80`; (2) rule checks
  for catalogue/grade/MOQ/credit-term facts; (3) an LLM review for vague specs or RFQ-vs-policy
  conflicts, each LLM finding verified by quote-matching against the real texts plus a second,
  narrower LLM confirmation call.
- **Output**: `state.validation_plan = {"decision": proceed|clarify|escalate, "issues": [...],
  "reviewed_by": [...]}`. `clarify` = only the customer can resolve it; `escalate` = only someone
  inside the company can.

### 4. Quotation & Communication Agent ("Drafting Agent", `drafting_agent.py`)
- **Input**: `state.validation_plan`, `state.extracted_requirements`, `state.retrieved_evidence`.
- **Grounded path**: emits `state.quotation_draft` with priced, cited line items, `subtotal`,
  `tax_amount` (18% GST), `total_amount`, `status = APPROVED` (pending human sign-off).
- **Abstention path**: emits `state.clarification_questions[]` and/or `state.escalation_notes`,
  and a draft with `status = CLARIFICATION_REQUIRED`.

### 5. Critic Agent (`critic_agent.py`)
- **Input**: the drafted quotation, the RFQ, retrieved evidence and policy text.
- **Layer 1 (rules, never trusted to an LLM)**: every RFQ item is on the draft at the requested
  quantity; every price matches the approved catalogue price after bulk discount; totals add up
  with GST; every priced line cites a chunk retrieval actually returned.
- **Layer 2 (LLM)**: judgement rules cannot make — customer terms that conflict with policy,
  requests the draft silently ignores, clarification questions that would not actually resolve the
  problem. Every LLM-raised "error" must quote the conflicting RFQ and policy sentences verbatim,
  both quotes are checked against the real texts, and a second, narrower LLM question confirms the
  conflict before it counts.
- **Output**: `state.critic_feedback = {"verdict": approve|revise, "issues": [...], "fix_by":
  [...], "round": n}`.

### Supervisor / Orchestrator (`orchestrator.py`)
- Not a pipeline stage with its own business logic — a routing layer. See the graph and
  decision rules above, and `docs/DESIGN.md` for the full rationale.

---

## Output Delivery

Once the critic approves and validation/planning did not require escalation, the draft reaches
`status = APPROVED` and is held `PENDING_APPROVAL` for a human sales manager (approve, reject, or
request changes) before a branded, tamper-evident customer PDF is generated via ReportLab.
