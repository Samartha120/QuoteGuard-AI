"""Tool: what the company already knows about a customer (long-term memory).

Every RFQ the system processes, and every quotation a sales manager approves or
rejects, is stored in the database. This tool reads that history back, so the agents
handle a returning customer differently from a stranger: an account with approved
quotations is an established customer, while one whose quotes keep being rejected
or escalated deserves a closer look.

The memory is written by normal use of the app (processing an RFQ, approving or
rejecting its quotation); nothing extra has to be recorded.
"""
import re
from typing import Any, Callable, Dict, Optional

from app.core.logging import logger

_SUFFIXES = {"ltd", "limited", "pvt", "private", "inc", "llp", "co", "corp", "company", "the"}


def normalize_customer(name: Optional[str]) -> str:
    """'Apex Engineering Works Ltd.' and 'APEX ENGINEERING WORKS PVT LTD' -> 'apex engineering works'."""
    words = re.findall(r"[a-z0-9]+", (name or "").lower())
    return " ".join(w for w in words if w not in _SUFFIXES)


def _default_session():
    from app.db.session import SessionLocal
    return SessionLocal()


def lookup_customer_history(customer_name: Optional[str], exclude_rfq_id: Optional[str] = None,
                            session_factory: Callable[[], Any] = _default_session) -> Dict[str, Any]:
    """Summary of past RFQs and quotations for this customer.

    Never raises: if the database cannot be read, returns {"found": False, "error": ...}
    so the calling agent carries on without memory instead of failing the RFQ."""
    key = normalize_customer(customer_name)
    if not key:
        return {"found": False, "reason": "no customer name"}
    try:
        from app.db.models import RFQ, Quotation
        db = session_factory()
        try:
            rfqs = [r for r in db.query(RFQ).all()
                    if normalize_customer(r.customer_name) == key and r.id != exclude_rfq_id]
            ids = {r.id for r in rfqs}
            quotes = db.query(Quotation).filter(Quotation.rfq_id.in_(ids)).all() if ids else []
            approved = [q for q in quotes if q.status == "APPROVED"]
            rejected = [q for q in quotes if q.status == "REJECTED"]
            escalated = [q for q in quotes if q.escalation_notes and "ESCALATED" in q.escalation_notes]
            products = sorted({li.product_code for q in approved for li in q.line_items
                               if li.product_code and "UNVERIFIED" not in li.product_code})
            last = max(approved, key=lambda q: q.created_at) if approved else None
            return {
                "found": bool(rfqs),
                "customer": customer_name,
                "past_rfqs": len(rfqs),
                "approved_quotations": len(approved),
                "rejected_quotations": len(rejected),
                "escalated_quotations": len(escalated),
                "approved_value_inr": round(sum(q.total_amount or 0 for q in approved), 2),
                "last_approved": last.created_at.date().isoformat() if last and last.created_at else None,
                "products_bought": products,
                "established": len(approved) > 0,
            }
        finally:
            db.close()
    except Exception as e:  # memory is helpful, never essential
        logger.warning(f"customer memory unavailable: {e}")
        return {"found": False, "error": f"{type(e).__name__}: {e}"}


def describe(memory: Dict[str, Any]) -> str:
    """One line for prompts and traces."""
    if memory.get("error"):
        return "customer history unavailable"
    if not memory.get("found"):
        return "new customer: no previous RFQs or quotations"
    parts = [f"returning customer: {memory['past_rfqs']} previous RFQ(s)",
             f"{memory['approved_quotations']} approved quotation(s)"]
    if memory.get("last_approved"):
        parts.append(f"last approved {memory['last_approved']}")
    if memory.get("rejected_quotations"):
        parts.append(f"{memory['rejected_quotations']} rejected")
    if memory.get("escalated_quotations"):
        parts.append(f"{memory['escalated_quotations']} escalated")
    if memory.get("products_bought"):
        parts.append("has bought " + ", ".join(memory["products_bought"]))
    return "; ".join(parts)
