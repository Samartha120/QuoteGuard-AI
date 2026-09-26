# QuoteGuard AI — Live Demonstration Script (45-Mark Viva)

**Team:** AXION AI  
**Product:** QuoteGuard AI

---

## Live Demonstration Walkthrough (15-Minute Protocol)

### Phase 1: Platform Overview & Knowledge Base Setup (3 mins)
1. **Open Application**: Navigate to `http://localhost:5173`. Point out the executive dashboard showing processing metrics, grounding rates, and visual agent workflow.
2. **Knowledge Base Inspection**: Click on **Knowledge Base**. Show the pre-loaded approved company sources:
   - `product_catalog_2026.md` (Product specs for IV-200, PV-100, FP-50)
   - `approved_pricing_2026.csv` (Approved unit prices, bulk discounts)
   - `commercial_delivery_terms.md` (Net 30 terms, Ex-works Pune)
3. **Key Point for Viva Evaluators**: Emphasize that QuoteGuard **only operates on approved company sources**.

---

### Phase 2: Standard Grounded RFQ Processing (DEMO RFQ 1) (5 mins)
1. Navigate to **RFQ Processing**.
2. Click **Load Sample RFQ 1 (Apex Engineering Works Ltd.)**.
3. Point out customer request:
   - 20 units of Industrial Valve IV-200 (SS304)
   - 15 units of Pressure Relief Valve PV-100 (SS304)
   - Payment terms: Net 30 days.
4. Click **Run Agentic Workflow**.
5. Observe real-time visual progress across agent stages:
   - `Requirement Extraction Agent` -> Extracted structured JSON.
   - `Retrieval Agent` -> Found matching catalogue entries and CSV pricing.
   - `Planning & Validation Agent` -> Confidence scores > 0.90 for all fields.
   - `Drafting Agent` -> Generated valid quotation draft.
6. **Source Attribution Verification**: Highlight the line item cards showing exact confidence badges (95%) and source citations (`approved_pricing_2026.csv`, line 2).
7. Click **Approve Quotation** and **Download PDF**. Open the generated ReportLab PDF to show formal B2B output.

---

### Phase 3: Hallucination Prevention & Abstention Demonstration (DEMO RFQ 2) (5 mins)
1. Click **Load Sample RFQ 2 (Zenith Chemical Processing Ltd.)**.
2. Point out customer request:
   - 50 units of IV-200 in **SS316 Stainless Steel Variant** (Not standard SS304 stock in KB).
   - Delivery within 3 days doorstep, 90 days credit terms.
3. Click **Run Agentic Workflow**.
4. Observe the **Abstention Logic in Action**:
   - `Requirement Extraction Agent` identifies requested SS316 grade.
   - `Retrieval Agent` searches vector store, retrieves only SS304 standard catalog.
   - `Planning Agent` calculates confidence = 0.40 (below 0.80 grounding threshold).
   - `Validation Agent` triggers **ABSTENTION & CLARIFICATION** flag.
   - `Drafting Agent` generates:
     > *"SS316 material variant for IV-200 cannot be grounded in approved pricing data. Standard stock is SS304. Clarification / Custom Engineering Quote Required."*
5. **Key Takeaway**: Show that traditional LLMs would hallucinate a price for SS316, whereas **QuoteGuard AI explicitly abstains and protects the business from financial/legal risk**.

---

### Phase 4: Evaluation Dashboard (2 mins)
1. Click **Evaluation** tab.
2. View metrics:
   - Grounding Rate: 100% on valid data.
   - Abstention Accuracy: 100% on unsupported spec requests.
   - Hallucination Rate: 0.0%.
   - Average Processing Latency: ~1.2 seconds.
