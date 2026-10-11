# QuoteGuard AI — Project Synopsis (CA3 Submission Artifact)

**Team:** AXION AI  
**Author / Deliverable Owner:** Tej Narayan Sah (`@tezzsha182`)  
**Product:** QuoteGuard AI — Source-Grounded Agentic Quotation Intelligence Platform for B2B MSMEs  

---

### Project Synopsis

QuoteGuard AI is an agentic AI quotation intelligence platform built for B2B MSMEs in manufacturing, engineering, and industrial supply that routinely process complex, unstructured Requests for Quotations (RFQs) arriving through customer emails, scanned PDF attachments, and purchase inquiries. Manual quotation processing is slow (averaging 2–4 hours per RFQ) and prone to human transcription errors. More critically, standard Generative AI chatbots introduce severe commercial hallucination risks—fabricating unapproved volume discounts, quoting non-existent alloy grades, or agreeing to contradictory delivery commitments that can cause substantial commercial liabilities.

To eliminate commercial hallucinations, QuoteGuard AI implements a Source-Grounded and Abstention-First multi-agent architecture. The system automates quotation drafting strictly when commercial parameters (catalog specs, base pricing tiers, and delivery policies) can be mathematically verified and grounded against company-approved enterprise knowledge bases. When requested specifications are missing, ambiguous, or out-of-catalog, the platform explicitly abstains—generating targeted clarification questions or escalating the case to human sales engineers rather than inventing details.

The platform coordinates four specialized LLM-driven agents managed by an adaptive LangGraph Supervisor and a dual-layer Critic Agent: (1) **Requirement Analysis Agent** converts raw RFQ text into structured line items and commercial constraints; (2) **Retrieval Agent** executes dynamic RAG tool calls across catalogue, pricing, and policy vector collections; (3) **Validation & Planning Agent** computes field-level grounding confidence scores (requiring >= 0.80) and formulates the proceeding plan (proceed, clarify, escalate); (4) **Quotation & Communication Agent** compiles itemized quotations with exact source citations or structured clarification requests; and (5) **Critic Agent** performs deterministic rule enforcement (arithmetic, discounts, GST, citation checks) and policy review, re-routing back for up to two revision cycles. QuoteGuard AI delivers complete operational auditability, per-agent evaluation benchmarks, and human-in-the-loop oversight for enterprise quotation workflows.
