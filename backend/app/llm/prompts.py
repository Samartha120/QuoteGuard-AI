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
- customer_name (string)
- customer_email (string or null)
- line_items: list of objects containing:
  - product_name (string)
  - product_code (string or null)
  - requested_spec (string or null)
  - material_grade (string or null)
  - quantity (integer)
- payment_terms (string or null)
- delivery_terms (string or null)
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
