"""Validation & Planning Agent (one of the four agents in the approved proposal).

Job: decide whether the evidence retrieval found is enough to quote, find what is
missing, conflicting or ambiguous, and choose the next action:

    proceed   — every line is grounded and nothing needs asking
    clarify   — something only the CUSTOMER can resolve (unstocked grade, missing
                quantity, vague spec, below minimum order)
    escalate  — something only SOMEONE INSIDE THE COMPANY can resolve (product not
                in the catalogue, credit beyond policy, evidence that cannot be found)

Three steps:
  1. Grounding scores. Reuses the existing planning and validation logic
     (planning_agent / validation_agent) for per-line confidence, the 0.80
     threshold and the verified / abstained status, so downstream agents and the
     UI keep working unchanged.
  2. Rule checks (`rule_issues`) for facts code can decide exactly.
  3. LLM review (`llm_issues`) for what rules cannot read: vague specifications,
     conflicting instructions inside the RFQ, terms that clash with policy. Every
     LLM finding must quote the RFQ (and, for a conflict, the evidence); the quotes
     are checked against the real texts, a repeat of a rule finding is dropped, and a
     second narrow LLM question must confirm each conflict or ambiguity.

Each issue names who can resolve it ("customer" or "internal"); the decision is
escalate if anything is internal, clarify if anything is for the customer, else
proceed. The supervisor routes on `state.validation_plan["decision"]`.
"""
import json
import re
import time
from typing import Any, Dict, List, Optional

from app.agents.state import AgentState
from app.agents.planning_agent import run_planning_agent
from app.agents.validation_agent import run_validation_agent
from app.agents.critic_agent import _norm, confirm_conflict, parse_reply, policy_texts, quote_found
from app.tools.pricing_catalog import approved_grades, get_catalog, lookup_product
from app.llm.client import llm_client
from app.core.config import settings
from app.core.logging import logger

AGENT_NAME = "Validation & Planning Agent"
STANDARD_CREDIT_DAYS = 30   # commercial_delivery_terms.md §1: Net 30 for approved customers
KINDS = {"missing", "conflicting", "ambiguous"}
RESOLVERS = {"customer", "internal"}
MAX_LLM_ISSUES = 6


def _issue(item: str, kind: str, detail: str, resolver: str, source: str = "rules") -> Dict[str, Any]:
    return {"item": item, "kind": kind, "detail": detail, "resolver": resolver, "source": source}


def _norm_grade(grade: str) -> str:
    return "".join(str(grade).upper().split())


# --------------------------------------------------------------------------- #
# Step 2: rule checks
# --------------------------------------------------------------------------- #

def _words(text: str) -> set:
    """Content words, with a trailing plural 's' dropped ("valves" -> "valve")."""
    return {w[:-1] if len(w) > 3 and w.endswith("s") else w for w in _norm(text).split() if len(w) > 2}


def closest_product(name: str) -> Optional[Dict[str, Any]]:
    """Best catalogue row for a loosely named product, if it shares most of the catalogue
    name's words — e.g. "pressure relief valves" -> Pressure Relief Valve PV-100."""
    asked = _words(name)
    best, best_score = None, 0.0
    for row in get_catalog().values():
        target = _words(row["name"]) - {row["code"].lower()}
        if not target:
            continue
        score = len(asked & target) / len(target)
        if score > best_score:
            best, best_score = row, score
    return best if best_score >= 0.6 else None


def credit_days(terms: Optional[str]) -> Optional[int]:
    """Days of credit asked for in free text ("Net 45", "90 days post-installation")."""
    if not terms:
        return None
    m = re.search(r"(\d{1,3})\s*-?\s*days?", str(terms).lower()) or re.search(r"net\s*(\d{1,3})", str(terms).lower())
    return int(m.group(1)) if m else None


def rule_issues(state: AgentState) -> List[Dict[str, Any]]:
    reqs = state.extracted_requirements or {}
    grades = {_norm_grade(g) for g in approved_grades()}
    issues: List[Dict[str, Any]] = []

    for item in reqs.get("line_items", []) or []:
        name = item.get("product_name") or "unnamed item"
        row = lookup_product(item.get("product_code") or "", item.get("product_name") or "")
        qty = item.get("quantity")
        grade = item.get("material_grade")

        if row is None:
            near = closest_product(name)
            if near:
                issues.append(_issue(name, "ambiguous", f"not an exact catalogue match; closest approved item "
                                     f"is {near['code']} ({near['name']}, {near['grade']}) — confirm with the customer",
                                     "customer"))
            else:
                issues.append(_issue(name, "missing", "product is not in the approved catalogue; sales must "
                                     "decide whether to offer a custom or alternative item", "internal"))
            continue
        if not isinstance(qty, (int, float)) or qty <= 0:
            issues.append(_issue(name, "missing", "no valid quantity in the RFQ", "customer"))
        elif row.get("moq") and qty < row["moq"]:
            issues.append(_issue(name, "conflicting",
                                 f"quantity {qty} is below the minimum order of {row['moq']}", "customer"))
        if grade and grades and _norm_grade(grade) not in grades:
            issues.append(_issue(name, "conflicting",
                                 f"requested grade '{grade}' is not stocked; approved grades: "
                                 f"{', '.join(sorted(g for g in grades if g))}", "customer"))
        conf = state.field_confidences.get(item.get("product_name", ""))
        stocked = not grade or not grades or _norm_grade(grade) in grades
        if stocked and conf is not None and conf < settings.GROUNDING_THRESHOLD:
            issues.append(_issue(name, "missing", f"evidence for this stocked item is weak "
                                 f"(confidence {conf:.2f} < {settings.GROUNDING_THRESHOLD})", "internal"))

    days = credit_days(reqs.get("payment_terms"))
    if days is not None and days > STANDARD_CREDIT_DAYS:
        issues.append(_issue("payment terms", "conflicting",
                             f"customer asks for {days}-day credit; policy standard is Net "
                             f"{STANDARD_CREDIT_DAYS}, so finance must approve", "internal"))
    return issues


# --------------------------------------------------------------------------- #
# Step 3: LLM review
# --------------------------------------------------------------------------- #

VP_PROMPT = """You are the Validation & Planning agent for B2B quotations. Before a quotation is
drafted, find anything in the customer's RFQ that is MISSING, CONFLICTING or AMBIGUOUS
compared with the company's approved evidence. Rule checks already found the issues
listed below — do not repeat them.

Look for, for example:
- specifications too vague to quote (no size, rating, grade or model where one is needed)
- requests that clash with company policy (delivery, freight, warranty, payment)
- instructions in the RFQ that contradict each other

CUSTOMER RFQ:
{rfq}

EXTRACTED REQUIREMENTS:
{requirements}

APPROVED EVIDENCE (catalogue, pricing, policy):
{evidence}

ALREADY FOUND BY RULES:
{rule_issues}

Reply with JSON only:
{{"issues": [{{"item": "<product or 'delivery' / 'payment' / ...>",
  "kind": "missing" or "conflicting" or "ambiguous",
  "detail": "<specific, one sentence>",
  "rfq_quote": "<exact words copied from the RFQ>",
  "evidence_quote": "<exact words copied from the evidence; required for conflicting>",
  "resolver": "customer" or "internal"}}]}}
"customer" = the customer must answer; "internal" = someone in the company must decide.
Return {{"issues": []}} if there is nothing beyond the rule findings."""


AMBIGUITY_CHECK = """A customer's request for quotation says:
"{rfq_quote}"

A reviewer claims: "{claim}"

The supplier's approved catalogue / pricing entries for this item:
{catalogue}

Must the supplier ask the customer this BEFORE it can issue a correct, priced quotation?
Answer false when the catalogue already fixes the detail (a standard grade, rating or
set point), when it does not change the price, or when it is an internal check the
supplier makes itself. Answer true only when the price or the product itself depends on
the customer's answer.
Reply with JSON only: {{"must_ask_customer": true or false, "why": "<one sentence>"}}"""


def _catalogue_context(state: AgentState, item: str) -> str:
    """Catalogue / pricing text about one item: its approved row plus matching evidence."""
    row = lookup_product("", item) or closest_product(item)
    parts = []
    if row:
        parts.append(f"{row['code']} {row['name']}: grade {row['grade']}, INR {row['unit_price']}/unit, "
                     f"MoQ {row['moq']}, lead time {row['lead_time_days']} days")
        key = row["code"].lower()
        parts += [e.get("content", "")[:500] for e in state.retrieved_evidence
                  if key in e.get("content", "").lower()][:2]
    return "\n".join(parts) or "(no catalogue entry found)"


def confirm_ambiguous(rfq_quote: str, claim: str = "", catalogue: str = "(not given)") -> Optional[bool]:
    """Second, narrow look at one claimed ambiguity or gap, with the catalogue in view.
    None if the LLM gives no usable answer."""
    try:
        raw = llm_client.generate_completion(
            system_prompt="You judge whether a quotation can be priced without asking the customer. "
                          "Answer with JSON only.",
            user_prompt=AMBIGUITY_CHECK.format(rfq_quote=rfq_quote, claim=claim, catalogue=catalogue),
        )
    except Exception:  # pragma: no cover
        return None
    if llm_client.demo_mode:
        return None
    answer = parse_reply(raw).get("must_ask_customer")
    return answer if isinstance(answer, bool) else None


def _repeats_rule(issue: Dict[str, Any], rules: List[Dict[str, Any]]) -> bool:
    """True when a rule already reported this item with mostly the same words."""
    words = _words(issue["detail"])
    for r in rules:
        if _words(r["item"]) & _words(issue["item"]) and len(words & _words(r["detail"])) >= 2:
            return True
    return False


def llm_issues(state: AgentState, rules: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    """LLM findings that survive the quote checks, or None when no LLM is available."""
    if llm_client.demo_mode:
        return None
    evidence = [e.get("content", "")[:500] for e in state.retrieved_evidence[:6]] + policy_texts(state)
    evidence_blob = "\n".join(evidence)
    prompt = VP_PROMPT.format(
        rfq=state.raw_text[:3000],
        requirements=json.dumps(state.extracted_requirements, default=str)[:2000],
        evidence="\n---\n".join(e[:600] for e in evidence) or "(none)",
        rule_issues=json.dumps([{k: i[k] for k in ("item", "kind", "detail")} for i in rules]),
    )
    try:
        raw = llm_client.generate_completion(
            system_prompt="You check RFQs for missing, conflicting or ambiguous information. Answer with JSON only.",
            user_prompt=prompt,
        )
    except Exception as e:  # pragma: no cover - the client already swallows most errors
        logger.warning(f"{AGENT_NAME}: LLM call failed: {e}")
        return None
    if llm_client.demo_mode:
        return None
    parsed = parse_reply(raw)
    if not isinstance(parsed.get("issues"), list):
        logger.warning(f"{AGENT_NAME}: LLM reply was not the expected JSON; using rule checks only")
        return None

    kept = []
    for i in parsed["issues"][:MAX_LLM_ISSUES]:
        if not isinstance(i, dict) or i.get("kind") not in KINDS or not str(i.get("detail", "")).strip():
            continue
        issue = _issue(str(i.get("item") or "RFQ"), i["kind"], str(i["detail"]).strip(),
                       i.get("resolver") if i.get("resolver") in RESOLVERS else "internal", source="llm")
        drop = None
        if not quote_found(i.get("rfq_quote"), state.raw_text):
            drop = "RFQ quote not found"
        elif _repeats_rule(issue, rules):
            drop = "already found by the rules"
        elif i["kind"] == "conflicting":
            if not quote_found(i.get("evidence_quote"), evidence_blob):
                drop = "evidence quote not found"
            elif confirm_conflict(i["rfq_quote"], i["evidence_quote"]) is False:
                drop = "second check found no conflict"
        elif i["kind"] in ("ambiguous", "missing") and confirm_ambiguous(
                i["rfq_quote"], issue["detail"], _catalogue_context(state, issue["item"])) is False:
            drop = "second check: can be quoted without asking"
        if drop:
            logger.info(f"{AGENT_NAME}: dropped LLM issue ({drop}): {issue['detail']!r}")
            continue
        issue["rfq_quote"] = i["rfq_quote"]
        kept.append(issue)
    return kept


# --------------------------------------------------------------------------- #
# Decision and entry point
# --------------------------------------------------------------------------- #

def decide(issues: List[Dict[str, Any]]) -> str:
    if any(i["resolver"] == "internal" for i in issues):
        return "escalate"
    if issues:
        return "clarify"
    return "proceed"


def run_validation_planning_agent(state: AgentState) -> AgentState:
    start = time.time()
    traces_before = len(state.agent_traces)

    # Step 1: grounding scores, line statuses and abstention flag (existing logic)
    state = run_planning_agent(state)
    state = run_validation_agent(state)
    del state.agent_traces[traces_before:]   # replaced by this agent's single trace below

    # Steps 2 and 3
    issues = rule_issues(state)
    reviewed_by = ["rules"]
    found = llm_issues(state, issues)
    if found is not None:
        reviewed_by.append("llm")
        issues += found

    decision = decide(issues)
    if decision != "proceed":
        state.abstention_required = True
        state.grounded_status = "ABSTAINED"

    state.validation_plan = {"decision": decision, "issues": issues, "reviewed_by": reviewed_by}

    head = "; ".join(f"{i['item']}: {i['detail']}" for i in issues[:3])
    elapsed = int((time.time() - start) * 1000)
    state.agent_traces.append({
        "agent_name": AGENT_NAME,
        "status": "SUCCESS" if decision == "proceed" else "WARNING",
        "output_summary": (f"Decision={decision}. Confidence={state.overall_confidence}. "
                           f"{len(issues)} issue(s), reviewed by {'+'.join(reviewed_by)}"
                           + (f". {head}" if head else "")),
        "execution_time_ms": elapsed,
    })
    logger.info(f"{AGENT_NAME}: {decision} with {len(issues)} issue(s) in {elapsed}ms")
    return state
