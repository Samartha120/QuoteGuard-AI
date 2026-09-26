# QuoteGuard AI — Architecture Documentation

**Team:** AXION AI  
**Product:** QuoteGuard AI — Source-Grounded Agentic Quotation Intelligence Platform for B2B MSMEs

---

## System Overview

QuoteGuard AI is built on a **Source-Grounded + Abstention-First** architectural paradigm designed to eliminate commercial hallucinations in automated B2B quotation workflows.

```
                     +---------------------------------------+
                     |    React + TypeScript Enterprise      |
                     |         Frontend Dashboard            |
                     +-------------------+-------------------+
                                         | REST API
                                         v
                     +-------------------+-------------------+
                     |       FastAPI Backend Gateway         |
                     +-------------------+-------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
+----+--------------------+    +---------+----------+    +-------------------+--------------------+
|  Document RAG Engine    |    | Agentic Workflow   |    | DB & Auditing Service              |
|  - pypdf / docx / pandas|    | - Requirement Ext. |    | - SQLAlchemy + SQLite/Postgres     |
|  - SentenceTransformers |    | - Retrieval Agent  |    | - ChromaDB Local Vector Store      |
|  - ChromaDB Vector Store|    | - Planning Agent   |    | - ReportLab PDF Generator          |
|  - Grounded Retriever   |    | - Validation Agent |    | - Evaluation Metrics Engine        |
+-------------------------+    | - Drafting Agent   |    +------------------------------------+
                               +--------------------+
```

---

## 1. Agentic Workflow Architecture

The core intelligent layer is decomposed into 5 specialized stage agents:

1. **Requirement Extraction Agent**:
   - Parses unstructured customer emails, PDFs, or pasted RFQs.
   - Extracts customer name, product requirements, quantity, desired specifications, payment terms, and delivery constraints into a strict Pydantic JSON schema.

2. **Retrieval Agent**:
   - Formulates targeted queries across product catalogues, approved pricing schedules, and commercial terms.
   - Queries ChromaDB with similarity score filtering (`threshold >= 0.80`).
   - Retrieves chunk metadata including `filename`, `page_number`, `section`, `chunk_id`, and exact `evidence_text`.

3. **Planning & Validation Agent**:
   - Evaluates retrieved evidence against extracted customer requirements.
   - Calculates a per-field confidence score using semantic distance and source match metrics.
   - Identifies missing details, material spec mismatches (e.g., requested SS316 vs approved SS304), or unapproved credit terms.
   - Applies the **Abstention Rule**: If confidence is below the `GROUNDING_THRESHOLD` (0.80), the system flags the field as `unverified` and halts automatic quotation generation for that item.

4. **Drafting Agent**:
   - Generates either:
     a) A fully grounded Quotation Draft with exact line item pricing and source citations.
     b) A structured Clarification Request for the customer/sales engineer.
     c) An Escalation Note for internal human review.

5. **Human-in-the-Loop Approval Agent**:
   - Holds draft quotations in `PENDING_APPROVAL` status.
   - Displays evidence panels and citation badges for human sales managers to review, request edits, approve, or reject.
   - Generates a branded, tamper-evident customer PDF via ReportLab upon approval.

---

## 2. RAG Pipeline Architecture

```
[Raw Document] -> [Parser (PDF/DOCX/CSV/TXT)] -> [Cleaner & Chunker] 
    -> [SentenceTransformer Embeddings] -> [ChromaDB Vector Store]
    -> [Top-K Semantic Retriever] -> [Grounding Verification] -> [Structured Output]
```

- **Chunking Strategy**: Overlapping recursive character splitter (Chunk Size: 500 chars, Overlap: 100 chars).
- **Metadata Tagging**: `doc_id`, `filename`, `doc_type`, `page`, `upload_timestamp`.
- **Retrieval Threshold**: Cosine similarity >= 0.80 for verified commercial grounding.

---

## 3. Technology Stack Summary

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS (Design Tokens, Glassmorphism, Dark Mode Support), Lucide React.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, SQLite (Dev) / PostgreSQL (Prod), ReportLab.
- **AI / RAG**: OpenAI Compatible API Client, ChromaDB, Sentence-Transformers, pytest test suite.
