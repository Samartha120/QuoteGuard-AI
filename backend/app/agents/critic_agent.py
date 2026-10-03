"""Critic agent: reviews a drafted quotation before it reaches a human.

Two layers:
  1. Rule checks (`check_draft`) — arithmetic and catalogue facts that must hold
     exactly: every RFQ item is on the draft, quantities match the RFQ, each
     price equals the approved catalogue price after the bulk-discount schedule,
     totals add up with 18% GST, and every price cites a chunk that retrieval
     actually returned. An LLM is not trusted with any of these.
  2. LLM review (`llm_review`) — judgement the rules cannot make: customer terms
     that conflict with company policy, questions the draft leaves unanswered,
     clarification questions that would not resolve the problem.

The LLM can add issues but cannot clear a rule failure, and its "error"s are
held to evidence: each must quote the RFQ sentence and the policy sentence that
conflict, both quotes are checked against the real texts, and a second narrow
LLM question confirms the two quotes really conflict. A claim that fails any of
these, or that the draft already raises with the customer, becomes a warning.

Any issue with severity
"error" makes the verdict "revise"; each issue names who should fix it
(drafting, retrieval or a human) so the orchestrator knows where to send it.
"""
import hashlib
import json
import re
import time
from typing import Any, Dict, List, Optional

from app.agents.state import AgentState
from app.tools.pricing_catalog import get_catalog, lookup_product, price_for_quantity
from app.tools.document_tool import get_delivery_policy
from app.llm.client import llm_client
from app.llm.structured_output import clean_and_parse_json
from app.core.logging import logger

GST_RATE = 0.18          # commercial_delivery_terms.md §3
MONEY_TOLERANCE = 0.01   # rupees; drafting rounds to 2 dp
FIX_TARGETS = {"drafting", "retrieval", "human"}
MAX_LLM_ISSUES = 5


def _issue(line: str, check: str, detail: str, fix_by: str = "drafting",
           severity: str = "error", source: str = "rules") -> Dict[str, Any]:
    return {"line": line, "check": check, "detail": detail,
            "fix_by": fix_by, "severity": severity, "source": source}


def _money_differs(a: Optional[float], b: Optional[float]) -> bool:
    return a is None or b is None or abs(float(a) - float(b)) > MONEY_TOLERANCE


def _base_code(code: str) -> str:
    return (code or "").replace("-UNVERIFIED", "")


def _match_line(item: Dict[str, Any], lines: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the draft line for an RFQ item: by catalogue code first, then by name."""
    row = lookup_product(item.get("product_code") or "", item.get("product_name") or "")
    if row:
        for line in lines:
            if _base_code(line.get("product_code", "")) == row["code"]:
                return line
    name = (item.get("product_name") or "").lower()
    for line in lines:
        if name and name in (line.get("product_name") or "").lower():
            return line
    return None


# --------------------------------------------------------------------------- #
# Layer 1: rule checks
# --------------------------------------------------------------------------- #

def check_draft(state: AgentState) -> List[Dict[str, Any]]:
    draft = state.quotation_draft or {}
    lines = draft.get("line_items", []) or []
    items = state.extracted_requirements.get("line_items", []) or []
    catalog = get_catalog()
    evidence_ids = {e.get("chunk_id") for e in state.retrieved_evidence}
    issues: List[Dict[str, Any]] = []

    if not draft:
        return [_issue("-", "draft_present", "drafting produced no quotation draft")]

    # every RFQ item is on the draft, with the quantity the customer asked for
    for item in items:
        name = item.get("product_name", "?")
        line = _match_line(item, lines)
        if line is None:
            issues.append(_issue(name, "coverage", "requested item is missing from the draft"))
            continue
        if item.get("quantity") is not None and line.get("quantity") != item.get("quantity"):
            issues.append(_issue(name, "quantity",
                                 f"draft quotes {line.get('quantity')} units, RFQ asks for {item.get('quantity')}"))

    priced = []
    for line in lines:
        label = line.get("product_code") or line.get("product_name", "?")
        status = line.get("status", "")
        has_price = line.get("unit_price") is not None or line.get("total_price") is not None

        if status in ("abstained", "unverified"):
            if has_price:
                issues.append(_issue(label, "abstained_has_price",
                                     "line is marked unverified but still carries a price"))
            continue

        priced.append(line)
        row = catalog.get(line.get("product_code", ""))
        if row is None:
            issues.append(_issue(label, "in_catalogue",
                                 "priced product code is not in the approved pricing schedule"))
            continue

        qty = line.get("quantity") or 0
        expected = price_for_quantity(row, qty)
        if _money_differs(line.get("unit_price"), expected["unit_price"]):
            note = f" after {expected['discount_rate']}% bulk discount" if expected["discount_rate"] else ""
            issues.append(_issue(label, "unit_price",
                                 f"unit price {line.get('unit_price')} but approved price is "
                                 f"{expected['unit_price']}{note} at qty {qty}"))
        elif _money_differs(line.get("total_price"), expected["total_price"]):
            issues.append(_issue(label, "line_total",
                                 f"line total {line.get('total_price')} != {expected['unit_price']} x {qty}"))

        if line.get("material_grade") and row["grade"] and line["material_grade"] != row["grade"]:
            issues.append(_issue(label, "grade",
                                 f"quoted grade {line['material_grade']} but catalogue stocks {row['grade']}"))

        if qty and row.get("moq") and qty < row["moq"]:
            issues.append(_issue(label, "moq", f"quantity {qty} is below the minimum order of {row['moq']}",
                                 fix_by="human", severity="warning"))

        cited = [c.get("source_chunk_id") for c in line.get("citations", []) or []]
        if not cited:
            issues.append(_issue(label, "citation", "price has no citation", fix_by="retrieval"))
        elif not any(c in evidence_ids for c in cited):
            issues.append(_issue(label, "citation",
                                 f"citation {cited} does not match any chunk retrieval returned",
                                 fix_by="retrieval"))

    # totals
    subtotal = round(sum((l.get("total_price") or 0.0) for l in priced), 2)
    tax = round(subtotal * GST_RATE, 2)
    for field, want in (("subtotal", subtotal), ("tax_amount", tax), ("total_amount", round(subtotal + tax, 2))):
        if _money_differs(draft.get(field, 0.0), want):
            issues.append(_issue("totals", field, f"{field} is {draft.get(field)} but should be {want}"))

    # abstention path must actually ask the customer something
    if state.abstention_required:
        if draft.get("status") != "CLARIFICATION_REQUIRED":
            issues.append(_issue("draft", "abstention_status",
                                 f"planning required abstention but draft status is {draft.get('status')}"))
        if not state.clarification_questions:
            issues.append(_issue("draft", "clarification",
                                 "draft abstains but asks the customer no clarification question"))

    return issues


# --------------------------------------------------------------------------- #
# Layer 2: LLM review
# --------------------------------------------------------------------------- #

CRITIC_PROMPT = """You are the reviewing agent for B2B quotations. Another agent drafted the
quotation below. Arithmetic, catalogue prices and citations have ALREADY been checked
by rules (results below) — do not repeat those checks.

Look only for problems the rules cannot see:
- customer payment, delivery or credit terms that conflict with the company policy evidence
- anything the customer asked for that the draft ignores
- clarification questions that are vague or would not resolve the problem

CUSTOMER RFQ:
{rfq}

DRAFT:
{draft}

CLARIFICATION QUESTIONS IN DRAFT:
{questions}

COMPANY POLICY EVIDENCE:
{policy}

RULE CHECK RESULTS:
{rule_issues}

Reply with JSON only:
{{"issues": [{{"line": "<product or 'terms'>", "detail": "<specific problem>",
  "rfq_quote": "<exact words from the RFQ>", "policy_quote": "<exact words from the policy>",
  "severity": "error" or "warning", "fix_by": "drafting" or "retrieval" or "human"}}],
 "summary": "<one sentence>"}}
Rules for your answer:
- Use "error" only for something that must change before a customer sees it, and
  only when you can copy the conflicting words exactly from the RFQ and the policy.
- If a clarification question in the draft already raises the problem, it is handled — do not report it.
- If the customer's terms agree with the policy, that is not a problem.
- Return an empty issues list if there is nothing beyond the rule results."""


def _norm(text: str) -> str:
    """Lowercase, drop punctuation, collapse spaces. A dot survives only inside a number (4275.50)."""
    text = re.sub(r"(?<!\d)\.|\.(?!\d)", " ", str(text).lower())
    return " ".join(re.sub(r"[^a-z0-9%. ]", " ", text).split())


def quote_found(quote: Any, text: str) -> bool:
    """True when the quote really occurs in the text (case, punctuation and spacing ignored)."""
    q = _norm(quote or "")
    return len(q) >= 6 and q in _norm(text)


_STOP = {"the", "and", "for", "with", "that", "this", "from", "which", "customer", "requested",
         "request", "policy", "company", "draft", "terms", "term", "are", "not", "has", "its"}


def already_asked(detail: str, questions: List[str]) -> bool:
    """True when a clarification question in the draft already raises this issue: it shares
    the issue's numbers (e.g. 90-day) and at least two of its other content words."""
    words = set(_norm(detail).split()) - _STOP
    numbers = {w for w in words if any(ch.isdigit() for ch in w)}
    content = {w for w in words - numbers if len(w) > 3}
    for q in questions:
        qw = set(_norm(q).split())
        if numbers <= qw and len(content & qw) >= 2:
            return True
    return False


def parse_reply(raw: str) -> Dict[str, Any]:
    """Parse the LLM's JSON, closing brackets a small model sometimes leaves off the end."""
    parsed = clean_and_parse_json(raw)
    if "error" not in parsed or not raw:
        return parsed
    text = raw.strip().rstrip(",")
    closers = ""
    for ch in text:  # naive bracket count — good enough for the trailing-brace case
        if ch in "{[":
            closers = ("}" if ch == "{" else "]") + closers
        elif ch in "}]" and closers:
            closers = closers[1:]
    return clean_and_parse_json(text + closers) if closers else parsed


def policy_texts(state: AgentState) -> List[str]:
    """Policy evidence from retrieval; if retrieval brought none, the critic fetches it itself."""
    texts = [e.get("content", "") for e in state.retrieved_evidence
             if (e.get("metadata") or {}).get("doc_type") == "policy"]
    if not texts:
        try:
            texts = [e.get("content", "") for e in get_delivery_policy()]
        except Exception as e:
            logger.warning(f"Critic could not fetch policy evidence: {e}")
    return [t for t in texts if t][:4]


VERIFY_PROMPT = """A customer's request for quotation says:
"{rfq_quote}"

The supplier's company policy says:
"{policy_quote}"

Would agreeing to exactly what the customer asks break this policy?
Requests that match the policy, or that the policy allows, do NOT break it.
Reply with JSON only: {{"breaks_policy": true or false, "why": "<one sentence>"}}"""


def confirm_conflict(rfq_quote: str, policy_quote: str) -> Optional[bool]:
    """Second, narrower look at one claimed conflict. None if the LLM gives no usable answer."""
    try:
        raw = llm_client.generate_completion(
            system_prompt="You check one claim about a contract. Answer with JSON only.",
            user_prompt=VERIFY_PROMPT.format(rfq_quote=rfq_quote, policy_quote=policy_quote),
        )
    except Exception as e:  # pragma: no cover
        logger.warning(f"Critic verification call failed: {e}")
        return None
    if llm_client.demo_mode:
        return None
    verdict = parse_reply(raw).get("breaks_policy")
    return verdict if isinstance(verdict, bool) else None


def llm_review(state: AgentState, rule_issues: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Returns {"issues": [...], "summary": str} or None when no LLM is available."""
    if llm_client.demo_mode:
        return None
    policy = policy_texts(state)
    policy_blob = "\n".join(policy)
    prompt = CRITIC_PROMPT.format(
        rfq=state.raw_text[:3000],
        draft=json.dumps(state.quotation_draft, indent=1, default=str)[:4000],
        questions=json.dumps(state.clarification_questions),
        policy="\n---\n".join(p[:800] for p in policy) or "(none available)",
        rule_issues=json.dumps([{k: i[k] for k in ("line", "check", "detail")} for i in rule_issues]) or "[]",
    )
    try:
        raw = llm_client.generate_completion(
            system_prompt="You review quotations for commercial risk. Answer with JSON only.",
            user_prompt=prompt,
        )
    except Exception as e:  # pragma: no cover - the client already swallows most errors
        logger.warning(f"Critic LLM call failed: {e}")
        return None
    if llm_client.demo_mode:
        return None  # the client fell back to canned output mid-call

    parsed = parse_reply(raw)
    if not isinstance(parsed, dict) or not isinstance(parsed.get("issues"), list):
        logger.warning("Critic LLM reply was not the expected JSON; ignoring it")
        return None

    issues = []
    for i in parsed["issues"][:MAX_LLM_ISSUES]:
        if not isinstance(i, dict) or not str(i.get("detail", "")).strip():
            continue
        detail = str(i["detail"]).strip()
        severity = "error" if i.get("severity") == "error" else "warning"
        downgraded = None
        if severity == "error":
            if not (quote_found(i.get("rfq_quote"), state.raw_text)
                    and quote_found(i.get("policy_quote"), policy_blob)):
                downgraded = "quotes not found in the RFQ and policy"
            elif already_asked(detail, state.clarification_questions):
                downgraded = "already raised in a clarification question"
            elif confirm_conflict(i["rfq_quote"], i["policy_quote"]) is False:
                downgraded = "second check found no conflict between the quoted terms"
        issue = _issue(
            line=str(i.get("line") or "terms"),
            check="llm_review",
            detail=detail,
            fix_by=i.get("fix_by") if i.get("fix_by") in FIX_TARGETS else "human",
            severity="warning" if downgraded else severity,
            source="llm",
        )
        if downgraded:
            issue["downgraded"] = downgraded
        issues.append(issue)
    return {"issues": issues, "summary": str(parsed.get("summary") or "").strip()}


# --------------------------------------------------------------------------- #
# Agent entry point
# --------------------------------------------------------------------------- #

def draft_digest(state: AgentState) -> str:
    """Fingerprint of what the customer would see: the draft and its clarification questions."""
    payload = json.dumps([state.quotation_draft, state.clarification_questions], sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def run_critic_agent(state: AgentState) -> AgentState:
    start = time.time()
    issues = check_draft(state)
    reviewed_by = ["rules"]
    summary = ""

    review = llm_review(state, issues)
    if review is not None:
        reviewed_by.append("llm")
        issues += review["issues"]
        summary = review["summary"]

    errors = [i for i in issues if i["severity"] == "error"]
    verdict = "revise" if errors else "approve"
    digest = draft_digest(state)
    state.critic_feedback = {
        "verdict": verdict,
        "issues": issues,
        "fix_by": sorted({i["fix_by"] for i in errors}),
        "reviewed_by": reviewed_by,
        "summary": summary,
        "round": state.critic_feedback.get("round", 0) + 1,
        # same draft as last round -> the revision changed nothing; the supervisor escalates
        "draft_digest": digest,
        "unchanged_since_last_round": digest == state.critic_feedback.get("draft_digest"),
    }

    elapsed = int((time.time() - start) * 1000)
    head = "; ".join(f"{i['line']}: {i['detail']}" for i in errors[:3])
    state.agent_traces.append({
        "agent_name": "Critic Agent",
        "status": "SUCCESS" if verdict == "approve" else "WARNING",
        "output_summary": (f"Verdict={verdict} ({len(errors)} errors, {len(issues) - len(errors)} warnings; "
                           f"reviewed by {'+'.join(reviewed_by)})" + (f". {head}" if head else "")),
        "execution_time_ms": elapsed,
    })
    logger.info(f"Critic Agent: {verdict} with {len(errors)} errors in {elapsed}ms")
    return state
