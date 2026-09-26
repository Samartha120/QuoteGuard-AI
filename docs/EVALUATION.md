# QuoteGuard AI — Evaluation Methodology & Metrics

**Team:** AXION AI  
**Product:** QuoteGuard AI

---

## Evaluation Framework Overview

QuoteGuard AI is systematically evaluated across 8 quantitative metrics to measure retrieval quality, commercial grounding, abstention precision, and operational efficiency.

```
       +-------------------------------------------------------+
       |             QUOTEGUARD EVALUATION MATRIX             |
       +---------------------------+---------------------------+
       | Quality & Grounding       | Operational Efficiency    |
       +---------------------------+---------------------------+
       | - Grounding Rate          | - Average Latency (s)     |
       | - Hallucination Rate      | - API Token Cost ($)      |
       | - Abstention Accuracy     | - Retrieval Precision     |
       | - Requirement Extraction %| - Citation Correctness    |
       +---------------------------+---------------------------+
```

---

## Formal Metric Definitions & Formulas

### 1. Grounding Rate ($G$)
Measures the proportion of commercial claims (prices, specs, terms) in generated draft quotations that are directly supported by verified evidence in the approved vector database.

$$G = \frac{\text{Number of Grounded Claims}}{\text{Total Commercial Claims Generated}} \times 100\%$$

*Target: $G \ge 95\%$*

---

### 2. Hallucination Rate ($H$)
Measures unsupported commercial claims, pricing inventions, or spec fabrications made by the drafting layer.

$$H = \frac{\text{Number of Unsupported / Fabricated Claims}}{\text{Total Commercial Claims Generated}} \times 100\%$$

*Target: $H = 0.0\%$*

---

### 3. Abstention Accuracy ($A$)
Evaluates the system's decision accuracy when encountering missing, ambiguous, or out-of-catalog customer requests (e.g., non-stock alloy variants, unapproved credit terms).

$$A = \frac{\text{Correct Abstentions Triggered}}{\text{Total Out-of-Scope / Unsupported Requests}} \times 100\%$$

*Target: $A = 100\%$*

---

### 4. Requirement Extraction Accuracy ($E$)
Measures how accurately customer entities (product names, quantities, requested lead times) are extracted from unstructured RFQ text.

$$E = \frac{\text{Correctly Extracted Attributes}}{\text{Total True Attributes in RFQ Ground Truth}} \times 100\%$$

---

### 5. Retrieval Precision ($P@K$)
Evaluates the proportion of retrieved text chunks (with $K=3$) that contain authoritative pricing or spec information relevant to the RFQ requirements.

$$P@K = \frac{\text{Relevant Chunks Retrieved in Top } K}{K}$$

---

### 6. Citation Correctness ($C$)
Validates whether the `source_file`, `chunk_id`, and `evidence_text` attached to a line item accurately map to the source document in ChromaDB.

---

### 7. Latency ($\Delta t$)
Total end-to-end execution time from RFQ upload to final quotation draft or clarification prompt generation.

---

### 8. API Cost Efficiency ($C_{API}$)
Total token consumption (Prompt + Completion) normalized per processed RFQ.
