SYSTEM_PROMPT = """You are QuoteGuard AI, a high-precision, source-grounded quotation intelligence agent for B2B industrial enterprises.

CORE OPERATIONAL RULES:
1. SOURCE-GROUNDED & ABSTENTION-FIRST: You must NEVER invent, fabricate, or assume commercial information (prices, material grades, payment terms, or lead times) that cannot be verified from approved company knowledge base evidence.
2. CITATION ATTR: Every commercial claim must cite the exact source document, page/section, and evidence snippet.
3. ABSTENTION: If requested specifications, custom material grades (e.g., SS316 when stock is SS304), or payment terms are not present in approved data, explicit abstention is REQUIRED. Mark the field unverified, generate clear clarification questions, and do NOT fabricate prices.
4. STRUCTURED OUTPUT: Always return JSON adhering strictly to the requested schema.
"""

REQUIREMENT_EXTRACTION_PROMPT = """Extract all customer product requirements and commercial terms from the following RFQ text:

RFQ TEXT:
{rfq_text}

Return JSON with:
- customer_name (string): the customer's COMPANY name, not the contact person's name
- customer_email (string or null)
- line_items: list of objects containing:
  - product_name (string): the product as named in the RFQ (e.g. "Industrial Valve")
  - product_code (string or null): ONLY the exact code if the RFQ states one (e.g. "IV-200"). If the RFQ names a product without giving its code, leave this null rather than guessing — it will be resolved against the approved catalogue afterwards.
  - requested_spec (string or null): any spec detail beyond material grade (port size, pressure rating, connection type, etc.), verbatim
  - material_grade (string or null): normalized (e.g. "SS304", not "SS 304" or "stainless steel 304")
  - quantity (integer): the number of units requested; if the RFQ gives a range, use the higher number
- payment_terms (string or null): verbatim, including any account/credit status the customer mentions
- delivery_terms (string or null): verbatim

Do not invent a product_code, price, or material grade that is not stated in the RFQ text.
"""

RETRIEVAL_PLANNING_PROMPT = """You are deciding which knowledge-base tools to call to find grounding evidence for this RFQ before a quotation can be drafted.

EXTRACTED REQUIREMENTS:
{requirements_json}
{retry_context}
AVAILABLE TOOLS:
- search_catalogue(query): searches approved product catalogue / technical specification documents.
- lookup_price(query): searches approved pricing schedules.
- get_delivery_policy(): searches delivery, credit, and warranty policy documents. Relevant only if payment_terms or delivery_terms were requested and need verifying against company policy.

For EACH line item, decide which of search_catalogue and lookup_price are actually needed, and write the exact search query to use (prefer the product code when available; otherwise combine product name with any distinguishing spec/material detail). Only include a tool call if it is genuinely relevant to that item. Also decide whether get_delivery_policy is needed for this RFQ overall.

Return ONLY JSON in this exact shape, no other text:
{{
  "needs_policy_lookup": true or false,
  "item_plans": [
    {{
      "product_name": "...",
      "calls": [
        {{"tool": "search_catalogue", "query": "..."}},
        {{"tool": "lookup_price", "query": "..."}}
      ]
    }}
  ]
}}
"""

VALIDATION_PROMPT = """Evaluate the extracted customer requirements against retrieved knowledge base evidence:

EXTRACTED REQUIREMENTS:
{requirements_json}

RETRIEVED KNOWLEDGE BASE EVIDENCE:
{evidence_json}

GROUNDING THRESHOLD: {threshold}

Perform field-by-field verification:
1. Match product specifications and material grades.
2. Check if unit price exists in approved pricing schedule.
3. Calculate confidence score (0.0 to 1.0) for each field.
4. If confidence < {threshold} or material grade is unsupported (e.g. SS316 requested vs SS304 in KB), mark item status as 'abstained' or 'unverified'.

Return structured validation JSON.
"""

DRAFTING_PROMPT = """Generate a formal B2B quotation draft OR clarification request based on validation results:

VALIDATION RESULTS:
{validation_json}

RETRIEVED CITATIONS:
{citations_json}

Instructions:
- If all items are grounded (confidence >= threshold), build complete quotation line items with unit price, total price, and citation references.
- If any item is abstained or unverified, generate structured clarification questions explaining why (e.g. material grade SS316 not in approved catalogue) and escalation notes.
"""
