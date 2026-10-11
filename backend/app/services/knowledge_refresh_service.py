"""Knowledge-base refresh: when a new catalogue or pricing document is uploaded, re-index it
(the existing ingestion path) and then show which already-quoted RFQs would now be quoted
differently with the refreshed knowledge base.

"Differently" is answered by actually re-running the real pipeline (the same
process_rfq_workflow every RFQ already goes through) against each existing RFQ, rather than
approximating it with a raw price/text diff — a price change is only part of the picture
(the new document could also change which items are groundable at all, or how confident the
agent is), and the pipeline is the single source of truth for that. Re-running produces a
brand new Quotation row (consistent with how re-processing an RFQ already works); this module
compares that new quotation against the RFQ's previous one and reports the diff.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.db.models import Quotation, QuotationLineItem, RFQ
from app.rag.ingestion import ingest_document_file
from app.services.rfq_service import get_all_rfqs, process_rfq_workflow
from app.core.logging import logger

PRICE_EPSILON = 0.01  # float cents noise; a real repricing is never this small


def _latest_quotation(db: Session, rfq_id: str) -> Optional[Quotation]:
    return (
        db.query(Quotation)
        .filter(Quotation.rfq_id == rfq_id)
        .order_by(Quotation.created_at.desc())
        .first()
    )


def _line_items_by_code(db: Session, quotation_id: str) -> Dict[str, QuotationLineItem]:
    items = db.query(QuotationLineItem).filter(QuotationLineItem.quotation_id == quotation_id).all()
    # product_code can be blank for an abstained/unverified item; fall back to product_name so
    # it still lines up across a re-quote instead of silently dropping out of the comparison.
    return {(item.product_code or item.product_name): item for item in items}


def _diff_quotations(before: Optional[Quotation], before_lines: Dict[str, QuotationLineItem],
                      after: Quotation, after_lines: Dict[str, QuotationLineItem]) -> Dict[str, Any]:
    """Compares two quotations for the same RFQ and reports what changed, if anything."""
    line_changes: List[Dict[str, Any]] = []
    all_codes = set(before_lines) | set(after_lines)
    for code in all_codes:
        old_item = before_lines.get(code)
        new_item = after_lines.get(code)
        old_price = old_item.unit_price if old_item else None
        new_price = new_item.unit_price if new_item else None
        old_status = old_item.status if old_item else "absent"
        new_status = new_item.status if new_item else "absent"

        price_changed = (old_price is None) != (new_price is None) or (
            old_price is not None and new_price is not None and abs(old_price - new_price) > PRICE_EPSILON
        )
        status_changed = old_status != new_status
        if price_changed or status_changed:
            line_changes.append({
                "product_code": code,
                "old_unit_price": old_price,
                "new_unit_price": new_price,
                "old_status": old_status,
                "new_status": new_status,
            })

    old_total = before.total_amount if before else None
    new_total = after.total_amount
    total_changed = (old_total is None) or abs(old_total - new_total) > PRICE_EPSILON
    old_grounded = before.grounded_status if before else None
    grounded_changed = old_grounded != after.grounded_status

    return {
        "changed": bool(line_changes) or total_changed or grounded_changed,
        "previous_total_amount": old_total,
        "new_total_amount": new_total,
        "previous_grounded_status": old_grounded,
        "new_grounded_status": after.grounded_status,
        "line_item_changes": line_changes,
    }


def refresh_knowledge_base(db: Session, file_path: str, filename: str, doc_type: str,
                            company_id: str = "comp_vertex_001") -> Dict[str, Any]:
    """Ingests a new catalogue/pricing/policy document, then re-quotes every existing RFQ
    against the refreshed knowledge base and reports which ones would now be quoted
    differently. Returns a dict matching KnowledgeRefreshResponse."""
    existing_rfqs: List[RFQ] = get_all_rfqs(db)
    # Snapshot each RFQ's current quotation (and its line items) BEFORE re-indexing, so the
    # "before" side of the diff reflects what the customer was actually quoted, not something
    # re-run after the knowledge base already changed.
    before_snapshot: Dict[str, Dict[str, Any]] = {}
    for rfq in existing_rfqs:
        quotation = _latest_quotation(db, rfq.id)
        before_snapshot[rfq.id] = {
            "quotation": quotation,
            "lines": _line_items_by_code(db, quotation.id) if quotation else {},
        }

    doc = ingest_document_file(db=db, file_path=file_path, filename=filename,
                                doc_type=doc_type, company_id=company_id)

    affected: List[Dict[str, Any]] = []
    unaffected_count = 0
    requote_failures: List[Dict[str, str]] = []

    for rfq in existing_rfqs:
        before = before_snapshot[rfq.id]
        if before["quotation"] is None:
            # Never successfully quoted before a knowledge refresh existed to compare against;
            # nothing meaningful to diff, so it's not counted either way.
            continue
        try:
            process_rfq_workflow(db, rfq.id)
        except Exception as e:  # pragma: no cover - defensive; a single RFQ must not block the rest
            logger.error(f"Knowledge refresh: re-quoting RFQ {rfq.id} failed: {e}")
            requote_failures.append({"rfq_id": rfq.id, "customer_name": rfq.customer_name, "error": str(e)})
            continue

        after_quotation = _latest_quotation(db, rfq.id)
        after_lines = _line_items_by_code(db, after_quotation.id)
        diff = _diff_quotations(before["quotation"], before["lines"], after_quotation, after_lines)

        if diff["changed"]:
            affected.append({"rfq_id": rfq.id, "customer_name": rfq.customer_name, **diff})
        else:
            unaffected_count += 1

    logger.info(
        f"Knowledge refresh: '{filename}' re-indexed; {len(affected)} of {len(existing_rfqs)} "
        f"existing RFQ(s) would now be quoted differently."
    )

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "chunks_created": doc.chunks_count,
        "indexed_status": doc.indexed_status,
        "affected_rfqs": affected,
        "unaffected_count": unaffected_count,
        "requote_failures": requote_failures,
    }
