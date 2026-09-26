# QuoteGuard AI — Agentic Workflow Architecture

**Team:** AXION AI  
**Product:** QuoteGuard AI

---

## Multi-Stage Agentic State Machine

QuoteGuard AI implements an explicit 5-stage agent state machine with state isolation, confidence evaluation, and structured function calling.

```
                  +-----------------------------------+
                  |         Incoming RFQ Text         |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |   Stage 1: Requirement Agent      |
                  |   - Extracts structured JSON      |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |     Stage 2: Retrieval Agent      |
                  |     - Calls Tool: search_kb()     |
                  |     - Fetches ChromaDB Chunks     |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  | Stage 3: Planning & Validation    |
                  | - Computes per-field confidence   |
                  | - Checks GROUNDING_THRESHOLD     |
                  +--------+----------------+---------+
                           |                |
             [Confidence >= 0.80]     [Confidence < 0.80]
                           |                |
                           v                v
      +--------------------+----+      +---+--------------------+
      |  Stage 4a: Drafting     |      |  Stage 4b: Abstention  |
      |  - Generates Quotation  |      |  - Generates           |
      |  - Attaches Citations   |      |    Clarification Qs    |
      +--------------------+----+      +---+--------------------+
                           |                |
                           +--------+-------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |    Stage 5: Human Approval        |
                  |    - Review, Edit, or Approve     |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |    ReportLab PDF Generation       |
                  +-----------------------------------+
```

---

## Stage Specifications

### Stage 1: Requirement Extraction Agent
- **Input**: Raw text or extracted text from PDF/DOCX.
- **Tools**: None.
- **Output**: Structured `RFQRequirements` Pydantic model (`customer_name`, `line_items`, `payment_terms`, `delivery_terms`).

### Stage 2: Retrieval Agent
- **Input**: Extracted requirements.
- **Tools Called**: `search_catalogue()`, `lookup_price()`, `get_delivery_policy()`.
- **Output**: Ranked evidence objects with similarity scores, chunk IDs, and source file metadata.

### Stage 3: Planning & Validation Agent
- **Input**: Extracted requirements + Retrieved evidence.
- **Logic**: Evaluates whether retrieved evidence conclusively covers every field.
- **Threshold Check**: If `confidence < 0.80` or if material spec is absent (e.g. SS316 requested vs SS304 in KB), sets state flag `ABSTENTION_REQUIRED = True`.

### Stage 4: Drafting Agent
- **Grounded Path**: Emits structured quotation line items, unit prices, totals, and citations.
- **Abstention Path**: Emits clarification questions detailing missing/conflicting items and internal escalation notes.

### Stage 5: Human Approval Agent
- **Input**: Draft quotation or clarification card.
- **Human Actions**: Approve, Reject, or Request Changes.
- **Output**: Trigger for final ReportLab B2B PDF generation.
