# QuoteGuard AI — Database & Schema Specifications

**Team:** AXION AI  
**Product:** QuoteGuard AI

---

## Relational Database Schema (SQLAlchemy ORM)

The relational database manages system state, RFQ records, generated quotations, source citations, audit logs, and evaluation runs.

```
+--------------------+       +--------------------+       +-------------------------+
|     companies      |       | knowledge_documents|       |     document_chunks     |
+--------------------+       +--------------------+       +-------------------------+
| id (PK)            |<----->| id (PK)            |<----->| id (PK)                 |
| name               | 1   * | company_id (FK)    | 1   * | document_id (FK)        |
| created_at         |       | filename           |       | chunk_id                |
+--------------------+       | document_type      |       | content                 |
                             | indexed_status     |       | metadata_json           |
                             +--------------------+       +-------------------------+

+--------------------+       +--------------------+       +-------------------------+
|        rfqs        |       |  rfq_requirements  |       |       quotations        |
+--------------------+       +--------------------+       +-------------------------+
| id (PK)            |<----->| id (PK)            |       | id (PK)                 |
| company_id (FK)    | 1   * | rfq_id (FK)        |       | rfq_id (FK)             |
| customer_name      |       | product_name       |       | total_amount            |
| raw_text           |       | quantity           |       | status (PENDING/APPROVED)|
| status             |       | specs_json         |       | created_at              |
+--------------------+       +--------------------+       +-------------------------+
                                                                       |
                                                                       v 1
                                                          +-------------------------+
                                                          |   quotation_line_items  |
                                                          +-------------------------+
                                                          | id (PK)                 |
                                                          | quotation_id (FK)       |
                                                          | product_code            |
                                                          | unit_price              |
                                                          | confidence_score        |
                                                          | citation_source         |
                                                          +-------------------------+
```

---

## Key Entity Definitions

1. **`KnowledgeDocument`**: Stores uploaded approved enterprise files (`filename`, `document_type`, `chunks_count`, `indexed_status`).
2. **`DocumentChunk`**: Stores chunked text snippets along with page/section metadata linked to vector store IDs.
3. **`RFQ`**: Stores incoming customer requests, customer metadata, and overall workflow status.
4. **`RFQRequirement`**: Normalized extracted product requirements per RFQ.
5. **`Quotation`**: Formal generated draft containing totals, status (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CLARIFICATION_REQUIRED`), and approval timestamps.
6. **`QuotationLineItem`**: Pricing, quantities, confidence scores, and source citation references per item.
7. **`SourceCitation`**: Linkage between line item fields and exact evidence chunk text.
8. **`AgentRun`**: Audit trail of execution traces per agent step (`Requirement`, `Retrieval`, `Planning`, `Validation`, `Drafting`).
9. **`EvaluationRun`**: Records quantitative benchmarking runs and calculated accuracy/grounding metrics.
