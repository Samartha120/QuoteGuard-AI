# QuoteGuard AI — Input / Output Definitions (Section B)

**Team:** AXION AI
**Author of this document:** Atharva Kulkarni

This document defines the **input** to the agentic workflow and the **output** it produces, as
JSON Schemas, each backed by a **real sample captured from an actual run of the pipeline**
(`workflow_orchestrator.run_pipeline`, the real entry point used by `POST /rfqs/{id}/process` —
see `backend/app/agents/workflow.py`), not hand-typed. See `docs/DESIGN.md` for the architecture
these inputs/outputs flow through.

---

## 1. Input

The workflow's input is the RFQ as submitted through the API (`RFQCreate`,
`backend/app/schemas/rfq.py`) plus a generated `rfq_id`; internally this becomes the `rfq_id` /
`raw_text` / `customer_name` fields of the shared `AgentState` the agents operate on.

### 1.1 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QuoteGuard RFQ Input",
  "type": "object",
  "required": ["rfq_id", "raw_text"],
  "properties": {
    "rfq_id": { "type": "string", "description": "Unique ID for this RFQ run" },
    "raw_text": { "type": "string", "description": "The customer's RFQ, as received (pasted text or text extracted from an uploaded PDF/DOCX)" },
    "customer_name": { "type": "string", "default": "", "description": "Optional hint; overwritten by whatever the Requirement Analysis Agent extracts from raw_text" },
    "file_name": { "type": ["string", "null"], "description": "Original uploaded file name, if the RFQ came from a file rather than pasted text" }
  }
}
```

### 1.2 Real sample input

Captured verbatim from `data/rfqs/demo_rfq_1_complete.txt`, the RFQ used to seed `AgentState` for
the run below:

```json
{
  "rfq_id": "demo-run-groq-1",
  "raw_text": "REQUEST FOR QUOTATION (RFQ)\n\nCustomer Name: Apex Engineering Works Ltd.\nContact Person: Rajesh Kumar (Procurement Manager)\nEmail: procurement@apexeng.co.in\nDate: 25th September 2026\n\nDear Vertex Sales Team,\n\nWe would like to request a formal quotation for the supply of industrial valve hardware for our upcoming refinery expansion project in Vadodara.\n\nPlease provide your best price and delivery schedule for the following items:\n1. Item: Industrial Valve IV-200\n   - Specification: Standard SS304 body with PTFE seals, PN16 rating, 2-inch (DN50) port\n   - Quantity: 20 units\n\n2. Item: Pressure Relief Valve PV-100\n   - Specification: Standard SS304 seat\n   - Quantity: 15 units\n\nRequired Terms:\n- Standard ex-works Pune delivery terms.\n- Payment terms: Net 30 days credit (Apex is an existing credit‑approved account with Vertex).\n\nPlease send the quotation at your earliest convenience.\n\nBest regards,\nRajesh Kumar\nApex Engineering Works Ltd.\n"
}
```

---

## 2. Output

The output is the final `AgentState` after `workflow_orchestrator.run_pipeline` returns — the
same object the API serializes into `RFQResponse` / `QuotationResponse`
(`backend/app/schemas/rfq.py`, `backend/app/schemas/quotation.py`) for the frontend. The full
field list (and what writes each field) is documented in `backend/app/agents/state.py` and
`docs/AGENT_WORKFLOW.md`.

### 2.1 JSON Schema (abridged — the fields a human/customer-facing consumer cares about most)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QuoteGuard Agent Run Output",
  "type": "object",
  "required": ["rfq_id", "extracted_requirements", "grounded_status", "quotation_draft"],
  "properties": {
    "rfq_id": { "type": "string" },
    "customer_name": { "type": "string" },
    "customer_email": { "type": ["string", "null"] },
    "extracted_requirements": {
      "type": "object",
      "properties": {
        "line_items": { "type": "array", "items": { "type": "object",
          "properties": {
            "product_name": { "type": "string" },
            "product_code": { "type": "string" },
            "requested_spec": { "type": "string" },
            "material_grade": { "type": "string" },
            "quantity": { "type": "integer" },
            "status": { "type": "string", "enum": ["verified", "missing", "ambiguous", "conflicting", "abstained"] }
          } } },
        "payment_terms": { "type": "string" },
        "delivery_terms": { "type": "string" }
      }
    },
    "retrieved_evidence": { "type": "array", "items": { "type": "object",
      "properties": {
        "chunk_id": { "type": "string" },
        "content": { "type": "string" },
        "metadata": { "type": "object" },
        "score": { "type": "number" },
        "is_grounded": { "type": "boolean" }
      } } },
    "field_confidences": { "type": "object", "additionalProperties": { "type": "number" } },
    "grounded_status": { "type": "string", "enum": ["PENDING", "GROUNDED", "UNVERIFIED", "ABSTAINED"] },
    "overall_confidence": { "type": "number" },
    "abstention_required": { "type": "boolean" },
    "validation_plan": { "type": "object",
      "properties": {
        "decision": { "type": "string", "enum": ["proceed", "clarify", "escalate"] },
        "issues": { "type": "array", "items": { "type": "object",
          "properties": {
            "item": { "type": "string" }, "kind": { "type": "string", "enum": ["missing", "conflicting", "ambiguous"] },
            "detail": { "type": "string" }, "resolver": { "type": "string", "enum": ["customer", "internal"] },
            "source": { "type": "string", "enum": ["rules", "llm"] }
          } } },
        "reviewed_by": { "type": "array", "items": { "type": "string" } }
      } },
    "quotation_draft": { "type": "object",
      "properties": {
        "customer_name": { "type": "string" },
        "subtotal": { "type": "number" }, "tax_amount": { "type": "number" }, "total_amount": { "type": "number" },
        "status": { "type": "string", "enum": ["PENDING_APPROVAL", "APPROVED", "REJECTED", "CLARIFICATION_REQUIRED"] },
        "line_items": { "type": "array", "items": { "type": "object",
          "properties": {
            "product_code": { "type": "string" }, "product_name": { "type": "string" },
            "material_grade": { "type": "string" }, "quantity": { "type": "integer" },
            "unit_price": { "type": ["number", "null"] }, "total_price": { "type": ["number", "null"] },
            "confidence_score": { "type": "number" }, "status": { "type": "string", "enum": ["verified", "unverified", "abstained"] },
            "citations": { "type": "array", "items": { "type": "object",
              "properties": {
                "field_name": { "type": "string" }, "source_filename": { "type": "string" },
                "source_chunk_id": { "type": "string" }, "evidence_snippet": { "type": "string" },
                "retrieval_score": { "type": "number" }
              } } }
          } } }
      } },
    "clarification_questions": { "type": "array", "items": { "type": "string" } },
    "escalation_notes": { "type": ["string", "null"] },
    "critic_feedback": { "type": "object",
      "properties": {
        "verdict": { "type": "string", "enum": ["approve", "revise"] },
        "issues": { "type": "array" }, "fix_by": { "type": "array", "items": { "type": "string" } },
        "round": { "type": "integer" }
      } },
    "agent_traces": { "type": "array", "items": { "type": "object",
      "properties": { "agent_name": { "type": "string" }, "status": { "type": "string" },
        "output_summary": { "type": "string" }, "execution_time_ms": { "type": "integer" } } } },
    "tool_call_log": { "type": "array", "items": { "type": "object",
      "properties": { "agent": { "type": "string" }, "tool": { "type": "string" },
        "query": { "type": ["string", "null"] }, "for_item": { "type": ["string", "null"] },
        "results_found": { "type": "integer" } } } },
    "orchestrator_decisions": { "type": "array", "items": { "type": "object",
      "properties": { "step": { "type": "integer" }, "next": { "type": "string" }, "reason": { "type": "string" },
        "decided_by": { "type": "string", "enum": ["forced", "llm", "policy"] }, "options": { "type": "array" } } } }
  }
}
```

### 2.2 Real sample output

Captured verbatim (unedited, including the exact confidence numbers and execution times) from
running `workflow_orchestrator.run_pipeline()` against the input above, with `DEMO_MODE=false` and
a real LLM provider configured (Groq, `openai/gpt-oss-120b`, reached through the OpenAI-compatible
client) and the knowledge base seeded exactly the way `app/main.py`'s startup lifespan seeds it
(the approved product catalogue, pricing sheet and delivery-terms policy). This replaces an
earlier capture of this document that was taken with no LLM configured and fell back to
`DEMO_MODE`'s canned responses — every `execution_time_ms` below is real wall-clock time against
the provider (2882ms / 10988ms / 2099ms / 1957ms for the four LLM-driven agents), which a canned
response can't produce. This run reaches **GROUNDED at 0.86 confidence** and the full approved
path end to end: the Retrieval Agent's LLM-selected tool calls find strong evidence on the first
pass (no retry needed, `attempts.retrieval = 1`), Validation & Planning's own LLM review agrees
with the rules check and proceeds, the Quotation & Communication Agent prices and cites both line
items, and the Critic approves the draft — while still catching something real: a warning that the
draft doesn't include the delivery schedule the customer asked for, which is genuine LLM reasoning
over the draft, not a rule.

```json
{
  "rfq_id": "demo-run-groq-1",
  "customer_name": "Apex Engineering Works Ltd.",
  "customer_email": "procurement@apexeng.co.in",
  "extracted_requirements": {
    "customer_name": "Apex Engineering Works Ltd.",
    "customer_email": "procurement@apexeng.co.in",
    "line_items": [
      { "product_name": "Industrial Valve", "product_code": "IV-200",
        "requested_spec": "Standard SS304 body with PTFE seals, PN16 rating, 2-inch (DN50) port",
        "material_grade": "SS304", "quantity": 20, "status": "verified" },
      { "product_name": "Pressure Relief Valve", "product_code": "PV-100",
        "requested_spec": "Standard SS304 seat", "material_grade": "SS304",
        "quantity": 15, "status": "verified" }
    ],
    "payment_terms": "Net 30 days credit (Apex is an existing credit‑approved account with Vertex)",
    "delivery_terms": "Standard ex‑works Pune"
  },
  "field_confidences": { "Industrial Valve": 0.86, "Pressure Relief Valve": 0.86 },
  "grounded_status": "GROUNDED",
  "overall_confidence": 0.86,
  "abstention_required": false,
  "validation_plan": {
    "decision": "proceed",
    "issues": [],
    "advisories": [
      { "item": "Pressure Relief Valve PV-100",
        "detail": "Connection type and pressure set range are not specified in the RFQ.",
        "note": "confirm with the customer on the purchase order" }
    ],
    "reviewed_by": ["rules", "llm"]
  },
  "quotation_draft": {
    "customer_name": "Apex Engineering Works Ltd.",
    "subtotal": 132000.0, "tax_amount": 23760.0, "total_amount": 155760.0,
    "status": "PENDING_APPROVAL",
    "line_items": [
      { "product_code": "IV-200", "product_name": "Industrial Valve IV-200",
        "material_grade": "SS304", "quantity": 20, "unit_price": 4500.0, "total_price": 90000.0,
        "confidence_score": 0.86, "status": "verified",
        "citations": [ { "field_name": "unit_price", "source_filename": "commercial_delivery_terms.md",
          "source_chunk_id": "86ea3001-0cdf-4ca3-9f58-e664853bab49_chunk_0",
          "evidence_snippet": "# Vertex Industrial Supplies Pvt. Ltd. ## Standard Commercial & Delivery Terms Policy (2026) ### 1. Payment Terms - Standard Credit Period: Net 30 Days from date of invoice for verified credit-ap",
          "retrieval_score": 0.7573 } ] },
      { "product_code": "PV-100", "product_name": "Pressure Relief Valve PV-100",
        "material_grade": "SS304", "quantity": 15, "unit_price": 2800.0, "total_price": 42000.0,
        "confidence_score": 0.86, "status": "verified",
        "citations": [ { "field_name": "unit_price", "source_filename": "commercial_delivery_terms.md",
          "source_chunk_id": "86ea3001-0cdf-4ca3-9f58-e664853bab49_chunk_0",
          "evidence_snippet": "# Vertex Industrial Supplies Pvt. Ltd. ## Standard Commercial & Delivery Terms Policy (2026) ### 1. Payment Terms - Standard Credit Period: Net 30 Days from date of invoice for verified credit-ap",
          "retrieval_score": 0.7573 } ] }
    ]
  },
  "clarification_questions": [],
  "escalation_notes": null,
  "critic_feedback": {
    "verdict": "approve",
    "issues": [
      { "line": "terms", "check": "llm_review",
        "detail": "Draft quotation does not provide a delivery schedule, which the customer explicitly requested.",
        "fix_by": "drafting", "severity": "warning", "source": "llm" }
    ],
    "fix_by": [], "reviewed_by": ["rules", "llm"],
    "summary": "Quotation missing the requested delivery schedule.",
    "round": 1, "draft_digest": "474a04929cc7ff5d", "unchanged_since_last_round": false
  },
  "agent_traces": [
    { "agent_name": "Requirement Extraction Agent", "status": "SUCCESS",
      "output_summary": "Extracted 2 line items and commercial terms for Apex Engineering Works Ltd.",
      "execution_time_ms": 2882 },
    { "agent_name": "Retrieval Agent", "status": "SUCCESS",
      "output_summary": "Executed 5 LLM-selected tool call(s) this run (retry: line items need catalogue, pricing and policy evidence), retrieving 9 unique evidence chunks.",
      "execution_time_ms": 10988 },
    { "agent_name": "Validation & Planning Agent", "status": "SUCCESS",
      "output_summary": "Decision=proceed. Confidence=0.86. 0 issue(s), reviewed by rules+llm",
      "execution_time_ms": 2099 },
    { "agent_name": "Quotation & Communication Agent", "status": "ACTION", "step": "task_analysis",
      "decision": "create_grounded_quotation",
      "details": { "revision_requested": false, "task": "validation & planning: proceed; draft the priced quotation",
        "line_items": 2, "critic_verdict": null },
      "execution_time_ms": 0 },
    { "agent_name": "Quotation & Communication Agent", "status": "ACTION", "step": "tool_selection",
      "decision": "Selected tools for current quotation task",
      "details": { "tools": ["lookup_product", "price_for_quantity", "calculate_quotation_totals"],
        "reason": "Tools selected according to quotation objective and current state instead of executing every tool blindly." },
      "execution_time_ms": 0 },
    { "agent_name": "Quotation & Communication Agent", "status": "ACTION", "step": "tool_execution",
      "decision": "Executed grounded quotation tools",
      "details": { "tools_selected": ["lookup_product", "price_for_quantity", "calculate_quotation_totals"],
        "tool_results": [
          { "tool": "lookup_product", "product": "Industrial Valve", "found": true },
          { "tool": "price_for_quantity", "product": "Industrial Valve", "quantity": 20,
            "list_price": 4500.0, "unit_price": 4500.0, "discount_rate": 0.0, "total_price": 90000.0 },
          { "tool": "lookup_product", "product": "Pressure Relief Valve", "found": true },
          { "tool": "price_for_quantity", "product": "Pressure Relief Valve", "quantity": 15,
            "list_price": 2800.0, "unit_price": 2800.0, "discount_rate": 0.0, "total_price": 42000.0 },
          { "tool": "calculate_quotation_totals", "subtotal": 132000.0, "tax_amount": 23760.0, "total_amount": 155760.0 }
        ] },
      "execution_time_ms": 0 },
    { "agent_name": "Quotation & Communication Agent", "status": "ACTION", "step": "result_evaluation",
      "decision": "quotation_ready",
      "details": { "decision": "quotation_ready", "line_items": 2, "verified_items": 2,
        "unverified_items": 0, "tool_calls": 5, "clarification_count": 0 },
      "execution_time_ms": 0 },
    { "agent_name": "Quotation & Communication Agent", "status": "SUCCESS",
      "output_summary": "Agent decision=quotation_ready. Status=PENDING_APPROVAL. Line Items=2. Clarifications=0.",
      "execution_time_ms": 0 },
    { "agent_name": "Critic Agent", "status": "SUCCESS",
      "output_summary": "Verdict=approve (0 errors, 1 warnings; reviewed by rules+llm)", "execution_time_ms": 1957 }
  ],
  "tool_call_log": [
    { "agent": "Retrieval Agent", "tool": "search_catalogue", "query": "IV-200", "for_item": "Industrial Valve", "results_found": 3 },
    { "agent": "Retrieval Agent", "tool": "lookup_price", "query": "IV-200", "for_item": "Industrial Valve", "results_found": 2 },
    { "agent": "Retrieval Agent", "tool": "search_catalogue", "query": "PV-100", "for_item": "Pressure Relief Valve", "results_found": 3 },
    { "agent": "Retrieval Agent", "tool": "lookup_price", "query": "PV-100", "for_item": "Pressure Relief Valve", "results_found": 2 },
    { "agent": "Retrieval Agent", "tool": "get_delivery_policy", "query": null, "for_item": null, "results_found": 3 }
  ],
  "orchestrator_decisions": [
    { "step": 1, "next": "extraction", "reason": "RFQ has not been read yet", "decided_by": "forced", "options": ["extraction"] },
    { "step": 2, "next": "retrieval", "reason": "line items need catalogue, pricing and policy evidence", "decided_by": "forced", "options": ["retrieval"] },
    { "step": 3, "next": "validation_planning", "reason": "evidence is in; check it is enough and plan the next step", "decided_by": "forced", "options": ["validation_planning"] },
    { "step": 4, "next": "drafting", "reason": "validation & planning: proceed; draft the priced quotation", "decided_by": "forced", "options": ["drafting"] },
    { "step": 5, "next": "critic", "reason": "draft written; review it before a human sees it", "decided_by": "forced", "options": ["critic"] },
    { "step": 6, "next": "finish", "reason": "critic approved the draft; ready for human approval", "decided_by": "forced", "options": ["finish"] }
  ],
  "completed_agents": ["extraction", "retrieval", "validation_planning", "drafting", "critic"],
  "attempts": { "extraction": 1, "retrieval": 1, "validation_planning": 1, "drafting": 1, "critic": 1 },
  "next_agent": "finish",
  "step": 6
}
```

*(`retrieved_evidence` — 9 real chunks from `product_catalog_2026.md`, `approved_pricing_2026.csv`
and `commercial_delivery_terms.md`, with real embedding similarity scores between 0.5679 and
0.7573 — and the full `messages` handoff log are omitted here only for length; both are present
verbatim in the raw captured run and follow the schema in §2.1.)*

**Reading this trace end-to-end:** every step had exactly one legal next move
(`decided_by: "forced"`), because the evidence was strong enough on the first pass that no retry
or escalation branch was ever reachable — this is the "nothing surprising happens" case the
architecture is meant to handle quietly. The one interesting signal is in `critic_feedback`: the
rules checks found nothing wrong (arithmetic, grounding, and citation checks all pass), but the
LLM review still flagged a real gap — the draft never mentions a delivery schedule even though the
RFQ asked for one — which is exactly the kind of judgement call the critic's LLM pass exists to
catch and the deterministic rules alone would miss.
