# QuoteGuard AI — Project Scope & Problem Statement

**Team:** AXION AI  
**Product:** QuoteGuard AI — Source-Grounded Agentic Quotation Intelligence Platform for B2B MSMEs

---

## 1. Problem Statement

Small and Medium Enterprises (MSMEs) in manufacturing, distribution, and industrial services process dozens of complex Requests for Quotation (RFQs) daily via unstructured PDF attachments, emails, and purchase inquiries. 

Manual processing is slow (average 2–4 hours per RFQ), prone to human copy-paste errors, and delays response times—leading to lost deals. Conversely, standard Generative AI chatbots introduce a critical liability: **commercial hallucination**. A chatbot that invents an unapproved 20% discount or misquotes a steel grade price can cost a manufacturer millions in legal or financial damages.

---

## 2. Solution: QuoteGuard AI

QuoteGuard AI enforces a **Source-Grounded + Abstention-First** agent architecture. It automates quotation draft generation only when commercial parameters can be mathematically verified against approved company knowledge bases (catalogues, price lists, terms). When data is missing, ambiguous, or out-of-scope, the platform explicitly **abstains**, asking clarification questions or escalating to human managers.

---

## 3. Project Scope Boundaries

### In Scope for Major Project MVP:
- End-to-end B2B dashboard for sales teams.
- RAG engine supporting PDF, DOCX, CSV, TXT, and Markdown knowledge ingestion.
- 5-stage explicit agent workflow (Extraction, Retrieval, Planning, Validation, Drafting).
- Confidence score computation and exact source citation attribution per commercial field.
- Explicit abstention logic for out-of-catalog or ambiguous specifications.
- Human-in-the-loop approval workflow and formal PDF generation.
- Built-in evaluation dashboard for grounding metrics and benchmark testing.
- Demo mode with full offline fallback for reliable viva presentation.

### Out of Scope / Future Enterprise Roadmap:
- Real-time ERP / CRM system integration (e.g., SAP, Salesforce, Tally).
- Dynamic multi-currency real-time exchange rate API sync.
- Multi-tenant enterprise SSO authentication (OAuth2 / SAML).
