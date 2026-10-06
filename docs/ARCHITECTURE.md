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
|  Document RAG Engine    |    |  Agentic Workflow   |    | DB & Auditing Service              |
|  - pypdf / docx / pandas|    |  (LangGraph graph,  |    | - SQLAlchemy + SQLite/Postgres     |
|  - SentenceTransformers |    |   see below)        |    | - ChromaDB Local Vector Store      |
|  - ChromaDB Vector Store|    +----------------------+    | - ReportLab PDF Generator          |
|  - Grounded Retriever   |                                | - Evaluation Metrics Engine        |
+-------------------------+                                +------------------------------------+
```

This document now describes the **current** agentic workflow. The old design (a fixed 5-stage
linear pipeline) has been replaced by a **supervisor + critic** architecture — see
`docs/AGENT_WORKFLOW.md` for the full routing logic, and the standalone
`docs/DESIGN.md` for the complete Section-B design writeup (architecture diagram, agent
roles, orchestration-pattern rationale and why LangGraph was chosen).

---

## 1. Agentic Workflow Architecture (current)

The intelligent layer is **four specialist agents** plus a **supervisor (orchestrator)** that
decides which agent runs next, and a **critic** that reviews the draft before it reaches a human:

```
                              +-----------------+
                 +----------->|   SUPERVISOR    |<-----------+
                 |            | (orchestrator)  |            |
                 |            +--------+--------+            |
                 |                     | routes one           |
                 |                     | agent at a time      |
                 |     +---------------+---------------+------+--------------+
                 |     |               |               |      |              |
                 |     v               v               v      v              |
                 |  +--+-----+   +-----+----+   +------+---+  +------+----+  |
                 |  |Require-|   |Retrieval |   |Validation|  |Quotation  |  |
                 |  |ment    |-->|Agent     |-->|& Planning|->|& Comms    |  |
                 |  |Analysis|   |(RAG tools|   |Agent     |  |(Drafting) |  |
                 |  |Agent   |   | search_* |   |(grounding|  |Agent      |  |
                 |  +--------+   | lookup_* |   | + rules  |  +-----+-----+  |
                 |                policy)    |   + LLM)    |        |        |
                 |               +-----------+   +---------+        v        |
                 |                                                +--+----+  |
                 +------------------------------------------------+ Critic|  |
                 ^ (back to retrieval/drafting on "revise")       | Agent |--+
                 |                                                +---+---+
                 |                      "approve" ------------------- |
                 |                                                    v
                 |                                         +----------+---------+
                 +-----------------------------------------+   finish | ESCALATE |
                                 (any agent can be sent back to a human sales   |
                                  by the supervisor when its retry  engineer)   |
                                  budget is used up)         +---------------------+
```

- **Requirement Analysis Agent** (`app/agents/requirement_agent.py`) — parses the raw RFQ text
  into structured JSON (customer, line items, payment/delivery terms).
- **Retrieval Agent** (`app/agents/retrieval_agent.py`) — LLM plans *which* tools to call per line
  item (`search_catalogue`, `lookup_price`, `get_delivery_policy`), executes only that plan, and
  logs every call to `state.tool_call_log`.
- **Validation & Planning Agent** (`app/agents/validation_planning_agent.py`) — scores grounding
  confidence per field against the `GROUNDING_THRESHOLD` (0.80), runs rule checks plus an LLM
  review for missing/conflicting/ambiguous requirements, and decides `proceed` / `clarify` /
  `escalate`.
- **Quotation & Communication Agent** ("Drafting Agent", `app/agents/drafting_agent.py`) — emits
  either a fully priced, cited quotation draft, or a clarification/escalation draft.
- **Critic Agent** (`app/agents/critic_agent.py`) — reviews the draft with deterministic rule
  checks (arithmetic, catalogue prices, citation validity) plus an evidence-grounded LLM review,
  and returns `approve` or `revise` (routing back to drafting or retrieval).
- **Supervisor / Orchestrator** (`app/agents/orchestrator.py`) — a LangGraph node that sits
  between every agent call. It computes the legal next moves from the current state, lets an LLM
  choose among them when more than one is legal, and always enforces retry/revision budgets so a
  stuck RFQ is escalated to a human rather than looping forever.

See `docs/DESIGN.md` for *why* this orchestration pattern (supervisor + critic, not a fixed
pipeline) and *why* LangGraph was used to implement it.

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
- **Embedding fallback**: if `sentence-transformers` is not installed, a deterministic hashing
  embedder is used instead so the pipeline is still runnable end-to-end in `DEMO_MODE` (see
  `docs/IO_SCHEMAS.md` for a real run captured under this fallback).

---

## 3. Technology Stack Summary

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS (Design Tokens, Glassmorphism, Dark Mode Support), Lucide React.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, SQLite (Dev) / PostgreSQL (Prod), ReportLab.
- **AI / RAG / Agentic**: OpenAI-compatible API client, LangGraph (supervisor graph), ChromaDB, Sentence-Transformers, pytest test suite.
