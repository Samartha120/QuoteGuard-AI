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
  "rfq_id": "demo-run-seeded-1",
  "raw_text": "REQUEST FOR QUOTATION (RFQ)\n\nCustomer Name: Apex Engineering Works Ltd.\nContact Person: Rajesh Kumar (Procurement Manager)\nEmail: procurement@apexeng.co.in\nDate: 25th September 2026\n\nDear Vertex Sales Team,\n\nWe would like to request a formal quotation for the supply of industrial valve hardware for our upcoming refinery expansion project in Vadodara.\n\nPlease provide your best price and delivery schedule for the following items:\n1. Item: Industrial Valve IV-200\n   - Specification: Standard SS304 body with PTFE seals, PN16 rating\n   - Quantity: 20 units\n\n2. Item: Pressure Relief Valve PV-100\n   - Specification: Standard SS304 seat\n   - Quantity: 15 units\n\nRequired Terms:\n- Standard ex-works Pune delivery terms.\n- Payment terms: Net 30 days credit.\n\nPlease send the quotation at your earliest convenience.\n\nBest regards,\nRajesh Kumar\nApex Engineering Works Ltd.\n"
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

Captured verbatim (unedited, including the exact confidence numbers) from running
`workflow_orchestrator.run_pipeline()` against the input above, with the knowledge base seeded
exactly the way `app/main.py`'s startup lifespan seeds it (the approved product catalogue,
pricing sheet and delivery-terms policy). This run used the deterministic hashing embedding
fallback (`sentence-transformers` not installed in this environment), which is why both items land
at **0.79 confidence — just under** the 0.80 `GROUNDING_THRESHOLD`. That is not a cherry-picked
"happy path": it is a genuine run that demonstrates exactly the behaviour the architecture is
designed around — the supervisor re-entering Retrieval once to try for better evidence
(`attempts.retrieval = 2`), Validation & Planning still finding the evidence too weak for a
*stocked* item, the Critic approving the *draft itself* as internally consistent, and the
supervisor nonetheless routing to **ESCALATE** rather than ever inventing a price.

```json
{
  "rfq_id": "demo-run-seeded-1",
  "customer_name": "Apex Engineering Works Ltd.",
  "customer_email": "procurement@apexeng.co.in",
  "extracted_requirements": {
    "customer_name": "Apex Engineering Works Ltd.",
    "customer_email": "procurement@apexeng.co.in",
    "line_items": [
      { "product_name": "Industrial Valve IV-200", "product_code": "IV-200",
        "requested_spec": "Standard SS304 body with PTFE seals, PN16 rating",
        "material_grade": "SS304", "quantity": 20, "status": "abstained" },
      { "product_name": "Pressure Relief Valve PV-100", "product_code": "PV-100",
        "requested_spec": "Standard SS304 seat", "material_grade": "SS304",
        "quantity": 15, "status": "abstained" }
    ],
    "payment_terms": "Net 30 days credit",
    "delivery_terms": "Ex-works Pune"
  },
  "field_confidences": { "Industrial Valve IV-200": 0.79, "Pressure Relief Valve PV-100": 0.79 },
  "grounded_status": "ABSTAINED",
  "overall_confidence": 0.79,
  "abstention_required": true,
  "validation_plan": {
    "decision": "escalate",
    "issues": [
      { "item": "Industrial Valve IV-200", "kind": "missing",
        "detail": "evidence for this stocked item is weak (confidence 0.79 < 0.8)",
        "resolver": "internal", "source": "rules" },
      { "item": "Pressure Relief Valve PV-100", "kind": "missing",
        "detail": "evidence for this stocked item is weak (confidence 0.79 < 0.8)",
        "resolver": "internal", "source": "rules" }
    ],
    "reviewed_by": ["rules"]
  },
  "quotation_draft": {
    "customer_name": "Apex Engineering Works Ltd.",
    "subtotal": 0.0, "tax_amount": 0.0, "total_amount": 0.0,
    "status": "CLARIFICATION_REQUIRED",
    "line_items": [
      { "product_code": "IV-200-UNVERIFIED", "product_name": "Industrial Valve IV-200 (SS304 variant)",
        "material_grade": "SS304", "quantity": 20, "unit_price": null, "total_price": null,
        "confidence_score": 0.79, "status": "abstained",
        "citations": [ { "field_name": "material_grade", "source_filename": "product_catalog_2026.md",
          "source_chunk_id": "e10fd0e4-05fa-428c-ab71-3b8b0a315070_chunk_0",
          "evidence_snippet": "# Vertex Industrial Supplies Pvt. Ltd. ... Product 1: IV-200 Heavy Duty Industrial Valve - Product Code: IV-200 - Categor",
          "retrieval_score": 0.6857 } ] },
      { "product_code": "PV-100-UNVERIFIED", "product_name": "Pressure Relief Valve PV-100 (SS304 variant)",
        "material_grade": "SS304", "quantity": 15, "unit_price": null, "total_price": null,
        "confidence_score": 0.79, "status": "abstained",
        "citations": [ { "field_name": "material_grade", "source_filename": "product_catalog_2026.md",
          "source_chunk_id": "e10fd0e4-05fa-428c-ab71-3b8b0a315070_chunk_0",
          "evidence_snippet": "# Vertex Industrial Supplies Pvt. Ltd. ... Product 1: IV-200 Heavy Duty Industrial Valve - Product Code: IV-200 - Categor",
          "retrieval_score": 0.6857 } ] }
    ]
  },
  "clarification_questions": [
    "Requirement Mismatch: Customer requested 'SS304' grade for 'Industrial Valve IV-200'. Approved catalogue only stocks: CARBON STEEL, SS304. Please confirm if a standard approved grade is acceptable or request a custom engineering evaluation.",
    "Requirement Mismatch: Customer requested 'SS304' grade for 'Pressure Relief Valve PV-100'. Approved catalogue only stocks: CARBON STEEL, SS304. Please confirm if a standard approved grade is acceptable or request a custom engineering evaluation."
  ],
  "escalation_notes": "ESCALATED BY ORCHESTRATOR: draft is ready, but Validation & Planning found items only someone in the company can decide: Industrial Valve IV-200: evidence for this stocked item is weak (confidence 0.79 < 0.8); Pressure Relief Valve PV-100: evidence for this stocked item is weak (confidence 0.79 < 0.8). A sales engineer must review this RFQ.",
  "critic_feedback": {
    "verdict": "approve", "issues": [], "fix_by": [], "reviewed_by": ["rules"],
    "summary": "", "round": 1, "draft_digest": "9c48bd3ddfaa4ec1", "unchanged_since_last_round": false
  },
  "agent_traces": [
    { "agent_name": "Requirement Extraction Agent", "status": "SUCCESS",
      "output_summary": "Extracted 2 line items and commercial terms for Apex Engineering Works Ltd.",
      "execution_time_ms": 0 },
    { "agent_name": "Retrieval Agent", "status": "SUCCESS",
      "output_summary": "Executed 5 LLM-selected tool call(s) this run (retry: line items need catalogue, pricing and policy evidence), retrieving 9 unique evidence chunks.",
      "execution_time_ms": 23 },
    { "agent_name": "Validation & Planning Agent", "status": "WARNING",
      "output_summary": "Decision=escalate. Confidence=0.79. 2 issue(s), reviewed by rules. Industrial Valve IV-200: evidence for this stocked item is weak (confidence 0.79 < 0.8); Pressure Relief Valve PV-100: evidence for this stocked item is weak (confidence 0.79 < 0.8)",
      "execution_time_ms": 1 },
    { "agent_name": "Retrieval Agent", "status": "SUCCESS",
      "output_summary": "Executed 5 LLM-selected tool call(s) this run (retry: weak evidence for stocked item(s) ['Industrial Valve IV-200', 'Pressure Relief Valve PV-100']; search again), retrieving 9 unique evidence chunks.",
      "execution_time_ms": 12 },
    { "agent_name": "Validation & Planning Agent", "status": "WARNING",
      "output_summary": "Decision=escalate. Confidence=0.79. 2 issue(s), reviewed by rules. Industrial Valve IV-200: evidence for this stocked item is weak (confidence 0.79 < 0.8); Pressure Relief Valve PV-100: evidence for this stocked item is weak (confidence 0.79 < 0.8)",
      "execution_time_ms": 0 },
    { "agent_name": "Quotation & Communication Agent", "status": "SUCCESS",
      "output_summary": "Agent decision=clarification_required. Status=CLARIFICATION_REQUIRED. Line Items=2. Clarifications=2.",
      "execution_time_ms": 0 },
    { "agent_name": "Critic Agent", "status": "SUCCESS",
      "output_summary": "Verdict=approve (0 errors, 0 warnings; reviewed by rules)", "execution_time_ms": 0 },
    { "agent_name": "Orchestrator", "status": "ESCALATED",
      "output_summary": "ESCALATED BY ORCHESTRATOR: draft is ready, but Validation & Planning found items only someone in the company can decide: ...",
      "execution_time_ms": 0 }
  ],
  "tool_call_log": [
    { "agent": "Retrieval Agent", "tool": "search_catalogue", "query": "Industrial Valve IV-200 SS304", "for_item": "Industrial Valve IV-200", "results_found": 3 },
    { "agent": "Retrieval Agent", "tool": "lookup_price", "query": "IV-200", "for_item": "Industrial Valve IV-200", "results_found": 2 },
    { "agent": "Retrieval Agent", "tool": "search_catalogue", "query": "Pressure Relief Valve PV-100 SS304", "for_item": "Pressure Relief Valve PV-100", "results_found": 3 },
    { "agent": "Retrieval Agent", "tool": "lookup_price", "query": "PV-100", "for_item": "Pressure Relief Valve PV-100", "results_found": 2 },
    { "agent": "Retrieval Agent", "tool": "get_delivery_policy", "query": null, "for_item": null, "results_found": 3 }
  ],
  "orchestrator_decisions": [
    { "step": 1, "next": "extraction", "reason": "RFQ has not been read yet", "decided_by": "forced", "options": ["extraction"] },
    { "step": 2, "next": "retrieval", "reason": "line items need catalogue, pricing and policy evidence", "decided_by": "forced", "options": ["retrieval"] },
    { "step": 3, "next": "validation_planning", "reason": "evidence is in; check it is enough and plan the next step", "decided_by": "forced", "options": ["validation_planning"] },
    { "step": 4, "next": "retrieval", "reason": "weak evidence for stocked item(s) ['Industrial Valve IV-200', 'Pressure Relief Valve PV-100']; search again", "decided_by": "policy", "options": ["retrieval", "drafting"] },
    { "step": 5, "next": "validation_planning", "reason": "evidence is in; check it is enough and plan the next step", "decided_by": "forced", "options": ["validation_planning"] },
    { "step": 6, "next": "drafting", "reason": "validation & planning: escalate; draft the clarification request covering: ...", "decided_by": "forced", "options": ["drafting"] },
    { "step": 7, "next": "critic", "reason": "draft written; review it before a human sees it", "decided_by": "forced", "options": ["critic"] },
    { "step": 8, "next": "escalate", "reason": "draft is ready, but Validation & Planning found items only someone in the company can decide: ...", "decided_by": "forced", "options": ["escalate"] }
  ],
  "completed_agents": ["extraction", "retrieval", "validation_planning", "drafting", "critic"],
  "attempts": { "extraction": 1, "retrieval": 2, "validation_planning": 2, "drafting": 1, "critic": 1 },
  "next_agent": "escalate",
  "step": 8
}
```

*(`retrieved_evidence` — 9 real chunks from `product_catalog_2026.md`, `approved_pricing_2026.csv`
and `commercial_delivery_terms.md` — and the full `messages` handoff log are omitted here only for
length; both are present verbatim in the raw captured run and follow the schema in §2.1.)*

**Reading this trace end-to-end:** step 4 is the one genuinely interesting routing decision —
with evidence retrieved but confidence still below threshold, two moves were legal
(`retrieval` again, or go straight to `drafting`), and the policy fallback picked `retrieval`
(an LLM would choose here in a non-demo run; see `orchestrator._ask_llm`). Every other step had
exactly one legal move (`decided_by: "forced"`), which is itself evidence that the guardrail in
`legal_moves()` is doing real work — most of the time there is nothing to decide, because the
state only ever makes one next step sensible.
