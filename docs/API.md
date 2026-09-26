# QuoteGuard AI — API Specification

**Team:** AXION AI  
**Base URL:** `http://localhost:8000/api`

---

## Health Endpoint
- **`GET /health`**
  - **Response**: `{ "status": "healthy", "demo_mode": true, "grounding_threshold": 0.80 }`

---

## RFQ Endpoints
- **`POST /rfqs`**
  - **Request Body**: `{ "customer_name": "Apex Engineering", "raw_text": "...", "file_name": "rfq_01.txt" }`
  - **Response**: Created RFQ Object (`id`, `status`, `created_at`)

- **`POST /rfqs/upload`**
  - **Form Data**: `file: UploadFile`, `customer_name: str`
  - **Response**: Extracted RFQ metadata and document ID.

- **`GET /rfqs`**
  - **Response**: List of all RFQs with status, customer, and date.

- **`GET /rfqs/{id}`**
  - **Response**: Detailed RFQ record including raw text, extracted requirements, retrieved evidence, and workflow run trace.

- **`POST /rfqs/{id}/process`**
  - **Response**: Triggers the 5-stage agent workflow (`RequirementExtraction` -> `Retrieval` -> `Planning` -> `Validation` -> `Drafting`).

---

## Knowledge Base Endpoints
- **`POST /knowledge/upload`**
  - **Form Data**: `file: UploadFile`, `document_type: str` (catalog | pricing | policy | faq)
  - **Response**: `{ "document_id": "...", "filename": "...", "chunks_created": 12, "status": "indexed" }`

- **`GET /knowledge/documents`**
  - **Response**: List of uploaded knowledge documents, chunk counts, indexing status, and upload dates.

- **`DELETE /knowledge/documents/{id}`**
  - **Response**: `{ "message": "Document deleted from database and vector store" }`

---

## Quotation Endpoints
- **`GET /quotations`**
  - **Response**: List of generated quotations with status (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CLARIFICATION_REQUIRED`).

- **`GET /quotations/{id}`**
  - **Response**: Full quotation object with line items, unit prices, source citations, confidence scores, and evidence snippets.

- **`POST /quotations/{id}/approve`**
  - **Response**: Marks quotation as approved by human manager, updates audit log, and prepares downloadable PDF.

- **`POST /quotations/{id}/reject`**
  - **Request Body**: `{ "reason": "Pricing too low" }`
  - **Response**: Marks quotation as rejected.

- **`POST /quotations/{id}/request-changes`**
  - **Request Body**: `{ "feedback": "Please re-verify delivery terms" }`

- **`GET /quotations/{id}/download`**
  - **Response**: Downloads formal PDF generated via ReportLab.

---

## Dashboard & Analytics Endpoints
- **`GET /dashboard/summary`**
  - **Response**: Aggregated metrics (`total_rfqs`, `quotations_generated`, `grounding_rate`, `clarification_count`, `avg_processing_time_sec`).

- **`GET /dashboard/activity`**
  - **Response**: Real-time event log / audit trail.

---

## Evaluation Endpoints
- **`POST /evaluation/run`**
  - **Response**: Triggers automated test benchmark suite over ground truth dataset.

- **`GET /evaluation/summary`**
  - **Response**: Metrics report (`retrieval_precision`, `grounding_rate`, `hallucination_rate`, `abstention_accuracy`, `avg_latency_ms`).
