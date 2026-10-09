"""Requirement Analysis Agent, part B: check the extraction against the RFQ and re-read.

An LLM reading an RFQ can drop a line item, invent a quantity, lose the payment terms,
or (when told to pick one number) turn "around 30 to 40 pieces" into a confident 40.
Before any other agent uses the extraction, this step:

1. checks it against the RFQ text with plain code (`find_problems`):
   - every quantity appears in the RFQ, and is not one end of a range ("30 to 40")
   - every catalogue product code the RFQ mentions was extracted
   - payment / delivery terms the RFQ states were not left empty
2. if anything is wrong, re-reads with a focused prompt that lists the problems and asks
   for a corrected extraction (`reread`), at most MAX_REREADS times, keeping whichever
   version has the fewest problems
3. marks quantities that are really ranges as missing, so Validation & Planning asks the
   customer instead of quoting a number the customer never committed to

Every check and re-read is written to `state.messages` (type "self-check").
"""
import json
import re
from typing import Any, Dict, List, Tuple

from app.agents.state import AgentState
from app.llm.client import llm_client
from app.llm.prompts import SYSTEM_PROMPT
from app.llm.structured_output import clean_and_parse_json
from app.tools.pricing_catalog import get_catalog
from app.core.logging import logger

MAX_REREADS = 2

_RANGE = re.compile(r"(\d[\d,]*)\s*(?:-|–|to|or)\s*(\d[\d,]*)", re.I)
_PAYMENT_CUES = re.compile(r"\b(payment|credit|net\s*\d+|advance|proforma)\b", re.I)
_DELIVERY_CUES = re.compile(r"\b(delivery|deliver|ex-?works|freight|dispatch|doorstep)\b", re.I)


def _numbers(text: str) -> List[int]:
    return [int(n.replace(",", "")) for n in re.findall(r"(?<![\w-])\d[\d,]*(?![\w-])", text)]


def _range_containing(qty: int, text: str):
    for m in _RANGE.finditer(text):
        low, high = (int(g.replace(",", "")) for g in m.groups())
        if qty in (low, high) and low < high:
            return m.group(0)
    return None


def find_problems(reqs: Dict[str, Any], raw_text: str) -> List[Dict[str, str]]:
    """What is wrong with the extraction, judged only against the RFQ text."""
    problems: List[Dict[str, str]] = []
    items = reqs.get("line_items") or []
    numbers = set(_numbers(raw_text))
    text = raw_text.lower()

    for item in items:
        if not isinstance(item, dict):
            continue
        name = item.get("product_code") or item.get("product_name") or "item"
        qty = item.get("quantity")
        if isinstance(qty, (int, float)) and not isinstance(qty, bool) and qty == int(qty):
            rng = _range_containing(int(qty), raw_text)
            if rng:
                problems.append({"kind": "range", "item": name,
                                 "detail": f"quantity {int(qty)} is one end of the range '{rng}' in the RFQ"})
            elif int(qty) not in numbers:
                problems.append({"kind": "quantity", "item": name,
                                 "detail": f"quantity {int(qty)} does not appear anywhere in the RFQ"})

    extracted_codes = {str(i.get("product_code") or "").upper() for i in items if isinstance(i, dict)}
    for code in get_catalog():
        if code.lower() in text and code.upper() not in extracted_codes:
            problems.append({"kind": "missed_item", "item": code,
                             "detail": f"the RFQ mentions {code} but no line item was extracted for it"})

    if _PAYMENT_CUES.search(raw_text) and not reqs.get("payment_terms"):
        problems.append({"kind": "missed_terms", "item": "payment_terms",
                         "detail": "the RFQ states payment terms but none were extracted"})
    if _DELIVERY_CUES.search(raw_text) and not reqs.get("delivery_terms"):
        problems.append({"kind": "missed_terms", "item": "delivery_terms",
                         "detail": "the RFQ states delivery terms but none were extracted"})
    return problems


REREAD_PROMPT = """You extracted requirements from the RFQ below, but a check against the RFQ text
found these problems:
{problems}

Read the RFQ again and return the COMPLETE corrected extraction as JSON, in the same shape:
{{"customer_name", "customer_email", "line_items": [{{"product_name", "product_code",
"requested_spec", "material_grade", "quantity"}}], "payment_terms", "delivery_terms"}}

Rules: copy quantities exactly as written; if the RFQ gives a range, set quantity to null.
Only use product codes the RFQ itself states. Keep terms verbatim. Do not invent anything.

RFQ TEXT:
{rfq}

YOUR PREVIOUS EXTRACTION:
{previous}"""


def reread(raw_text: str, reqs: Dict[str, Any], problems: List[Dict[str, str]]) -> Dict[str, Any]:
    """One focused re-read. Returns the new extraction, or {} if the LLM gives nothing usable."""
    prompt = REREAD_PROMPT.format(
        problems="\n".join(f"- {p['detail']}" for p in problems),
        rfq=raw_text[:6000], previous=json.dumps(reqs, default=str)[:3000])
    try:
        raw = llm_client.generate_completion(system_prompt=SYSTEM_PROMPT, user_prompt=prompt)
    except Exception as e:  # LLM down: keep what we have rather than fail the RFQ
        logger.warning(f"Requirement self-check: re-read skipped ({e})")
        return {}
    parsed = clean_and_parse_json(raw)
    return parsed if isinstance(parsed.get("line_items"), list) else {}


def clear_ranges(reqs: Dict[str, Any], problems: List[Dict[str, str]]) -> List[str]:
    """Quantities that are really ranges become missing, with a note Validation & Planning
    turns into a question for the customer."""
    notes = []
    for p in problems:
        if p["kind"] != "range":
            continue
        for item in reqs.get("line_items") or []:
            name = item.get("product_code") or item.get("product_name")
            if name == p["item"] and item.get("quantity") is not None:
                item["quantity"] = None
                notes.append(f"{item.get('product_name') or name}: quantity given as a range "
                             f"({p['detail'].split(chr(39))[1]})")
    if notes:
        reqs.setdefault("normalization_notes", []).extend(notes)
    return notes


def self_check(state: AgentState) -> AgentState:
    """Check the extraction, re-read if needed, and clear range quantities."""
    reqs = state.extracted_requirements or {}
    problems = find_problems(reqs, state.raw_text)
    if not problems:
        state.messages.append({"step": state.step, "from": "extraction", "to": "extraction",
                               "type": "self-check", "content": "extraction matches the RFQ text"})
        return state

    best, best_problems = reqs, problems
    for attempt in range(1, MAX_REREADS + 1):
        # ranges are resolved by asking the customer, not by re-reading
        fixable = [p for p in best_problems if p["kind"] != "range"]
        if not fixable:
            break
        state.messages.append({"step": state.step, "from": "extraction", "to": "extraction",
                               "type": "self-check",
                               "content": f"re-read {attempt}: " + "; ".join(p["detail"] for p in fixable)})
        candidate = reread(state.raw_text, best, fixable)
        if not candidate:
            break
        candidate_problems = find_problems(candidate, state.raw_text)
        if len(candidate_problems) < len(best_problems):
            best, best_problems = candidate, candidate_problems
        else:
            break   # the re-read did not help; stop spending calls

    cleared = clear_ranges(best, best_problems)
    remaining = [p for p in best_problems if p["kind"] != "range"]
    state.extracted_requirements = best
    if best.get("customer_name") and not state.customer_name:
        state.customer_name = best["customer_name"]
    summary = (f"{len(problems)} problem(s) found, {len(remaining)} left after re-reading"
               + (f"; {len(cleared)} range quantity(ies) sent to the customer" if cleared else ""))
    state.messages.append({"step": state.step, "from": "extraction", "to": "extraction",
                           "type": "self-check", "content": summary})
    if remaining:
        best.setdefault("normalization_notes", []).extend(f"self-check: {p['detail']}" for p in remaining)
    return state
