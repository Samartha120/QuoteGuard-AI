# QuoteGuard AI — Generative AI / Agentic AI Course Syllabus Alignment

**Team:** AXION AI  
**Course:** 4th Year Computer Science & Engineering — Generative AI / Agentic AI Major Project

---

| Syllabus Unit | Core Concept | Implementation in QuoteGuard AI | Target Code Location |
| :--- | :--- | :--- | :--- |
| **UNIT 1: LLM Fundamentals & API Integration** | - Transformer Inference<br>- LLM API Abstraction<br>- Model Providers | - Unified OpenAI-compatible LLM client abstraction (`LLMClient`) supporting standard endpoints.<br>- Graceful fallback demo provider when no API key is provided. | `backend/app/llm/client.py`<br>`backend/app/core/config.py` |
| **UNIT 2: Prompt Engineering & Structured Outputs** | - System Prompts<br>- Few-shot Prompting<br>- Pydantic / JSON Schema Enforcement | - Centralized prompt templates (`SYSTEM_PROMPT`, `REQUIREMENT_PROMPT`, `VALIDATION_PROMPT`).<br>- Strict Pydantic structured output validation. | `backend/app/llm/prompts.py`<br>`backend/app/llm/structured_output.py` |
| **UNIT 3: NLP, Embeddings & RAG** | - Document Parsing & Chunking<br>- Vector Embeddings<br>- Vector DB Retrieval<br>- Semantic Search | - Recursive document chunking (`Chunker`).<br>- SentenceTransformer embeddings & ChromaDB vector database.<br>- Metadata-filtered RAG retrieval. | `backend/app/rag/loader.py`<br>`backend/app/rag/chunker.py`<br>`backend/app/rag/vector_store.py` |
| **UNIT 4: Agentic AI & Tool Calling** | - Multi-agent Orchestration<br>- Function/Tool Calling<br>- Abstention Logic<br>- Planning & Validation | - LangGraph **supervisor + critic** agent graph: 4 specialist agents (`Requirement Analysis`, `Retrieval`, `Validation & Planning`, `Quotation & Communication`) routed dynamically by a supervisor, with a Critic Agent reviewing every draft before it reaches a human.<br>- LLM-planned tool calling (`search_catalogue`, `lookup_price`, `get_delivery_policy`), logged per call in `state.tool_call_log`.<br>- Grounding threshold (0.80) abstention engine. | `backend/app/agents/orchestrator.py`<br>`backend/app/agents/*.py`<br>`backend/app/tools/`<br>`docs/DESIGN.md` |
| **UNIT 5: System Architecture & Responsible AI** | - Human-in-the-Loop<br>- System Evaluation<br>- Traceability & Auditing<br>- Hallucination Mitigation | - Enterprise Human Approval UI panel.<br>- Comprehensive evaluation engine measuring Grounding Rate, Abstention Accuracy, Hallucination Rate.<br>- Exact source citation tracking per commercial field. | `frontend/src/components/quotation/ApprovalPanel.tsx`<br>`backend/app/services/evaluation_service.py`<br>`docs/EVALUATION.md` |
