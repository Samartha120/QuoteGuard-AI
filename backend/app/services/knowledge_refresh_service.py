"""Knowledge-base refresh: when a new catalogue or pricing document is uploaded, re-index it
(the existing ingestion path) and then PREVIEW which already-quoted RFQs would now be quoted
differently with the refreshed knowledge base.

"Differently" is answered by actually re-running the real pipeline (the same
workflow_orchestrator.run_pipeline every RFQ already goes through) against each existing RFQ,
rather than approximating it with a raw price/text diff — a price change is only part of the
picture (the new document could also change which items are groundable at all, or how
confident the agent is), and the pipeline is the single source of truth for that.

This is a PREVIEW, not a re-quote: the pipeline runs in memory (same pattern as
app/services/evaluation_service.py's benchmark) and nothing is written to the database for
the existing RFQs. Vedant's review on PR #24 flagged that the first version called
process_rfq_workflow(), which inserts a brand-new Quotation row per RFQ — silently replacing
real (even already-approved) quotes and feeding customer memory just from uploading a
document. A sales manager should see the diff and decide whether to actually re-quote each
RFQ, not have it happen implicitly as a side effect of a knowledge refresh.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator
from app.db.models import KnowledgeDocument, Quotation, QuotationLineItem, RFQ
from app.rag.ingestion import ingest_document_file
from app.services.knowledge_service import delete_document
from app.services.rfq_service import get_all_rfqs
from app.core.logging import logger

PRICE_EPSILON = 0.01  # float cents noise; a real repricing is never this small

# How many existing RFQs to re-run the pipeline for in one refresh call. Each one is a full
# agent-pipeline run (several LLM calls), so an unbounded "re-quote every RFQ we've ever
# taken" doesn't scale and can blow through rate limits on a large knowledge base update.
DEFAULT_MAX_PREVIEW_RFQS = 20


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


def _diff_against_draft(before: Optional[Quotation], before_lines: Dict[str, QuotationLineItem],
                         after_draft: Dict[str, Any], after_grounded_status: str) -> Dict[str, Any]:
    """Compares the RFQ's saved quotation against the in-memory draft the refreshed knowledge
    base would now produce, and reports what changed, if anything. `after_draft` is
    AgentState.quotation_draft and `after_grounded_status` is AgentState.grounded_status,
    straight from the pipeline run — never a persisted row."""
    after_lines = {
        (li.get("product_code") or li.get("product_name") or ""): li
        for li in after_draft.get("line_items", [])
    }

    line_changes: List[Dict[str, Any]] = []
    all_codes = set(before_lines) | set(after_lines)
    for code in all_codes:
        old_item = before_lines.get(code)
        new_item = after_lines.get(code)
        old_price = old_item.unit_price if old_item else None
        new_price = new_item.get("unit_price") if new_item else None
        old_status = old_item.status if old_item else "absent"
        new_status = new_item.get("status", "absent") if new_item else "absent"

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
    new_total = after_draft.get("total_amount", 0.0)
    total_changed = (old_total is None) or abs(old_total - new_total) > PRICE_EPSILON
    old_grounded = before.grounded_status if before else None
    new_grounded = after_grounded_status
    grounded_changed = old_grounded != new_grounded

    return {
        "changed": bool(line_changes) or total_changed or grounded_changed,
        "previous_total_amount": old_total,
        "new_total_amount": new_total,
        "previous_grounded_status": old_grounded,
        "new_grounded_status": new_grounded,
        "line_item_changes": line_changes,
    }


def refresh_knowledge_base(db: Session, file_path: str, filename: str, doc_type: str,
                            company_id: str = "comp_vertex_001",
                            max_preview_rfqs: int = DEFAULT_MAX_PREVIEW_RFQS) -> Dict[str, Any]:
    """Ingests a new catalogue/pricing/policy document, replacing any earlier document of the
    same doc_type, then PREVIEWS how every already-quoted RFQ (up to max_preview_rfqs, most
    recent first) would be quoted against the refreshed knowledge base. Nothing is written to
    the database for those RFQs — this only reports what would change. Returns a dict matching
    KnowledgeRefreshResponse."""
    existing_rfqs: List[RFQ] = get_all_rfqs(db)  # already ordered by created_at desc

    # Snapshot each RFQ's current quotation (and its line items) BEFORE re-indexing, so the
    # "before" side of the diff reflects what the customer was actually quoted.
    before_snapshot: Dict[str, Dict[str, Any]] = {}
    preview_candidates: List[RFQ] = []
    for rfq in existing_rfqs:
        quotation = _latest_quotation(db, rfq.id)
        if quotation is None:
            # Never successfully quoted before a knowledge refresh existed to compare against;
            # nothing meaningful to diff, so it's not counted either way.
            continue
        before_snapshot[rfq.id] = {"quotation": quotation, "lines": _line_items_by_code(db, quotation.id)}
        preview_candidates.append(rfq)

    skipped_count = max(0, len(preview_candidates) - max_preview_rfqs)
    preview_candidates = preview_candidates[:max_preview_rfqs]

    # Capture any existing document(s) of this type BEFORE ingesting the replacement, so a
    # failed ingestion never leaves us having deleted the one that was still live.
    prior_docs = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.document_type == doc_type)
        .all()
    )

    doc = ingest_document_file(db=db, file_path=file_path, filename=filename,
                                doc_type=doc_type, company_id=company_id)

    # This refresh supersedes any earlier document of the same type — replace it rather than
    # leaving both indexed (which would otherwise surface duplicate/conflicting evidence for
    # the same catalogue, pricing sheet, or policy going forward).
    for old_doc in prior_docs:
        if old_doc.id != doc.id:
            delete_document(db, old_doc.id)

    affected: List[Dict[str, Any]] = []
    unaffected_count = 0
    requote_failures: List[Dict[str, str]] = []

    for rfq in preview_candidates:
        before = before_snapshot[rfq.id]
        try:
            state = AgentState(rfq_id=rfq.id, raw_text=rfq.raw_text, customer_name=rfq.customer_name)
            final_state = workflow_orchestrator.run_pipeline(state)
        except Exception as e:  # pragma: no cover - defensive; a single RFQ must not block the rest
            logger.error(f"Knowledge refresh preview: re-running RFQ {rfq.id} failed: {e}")
            requote_failures.append({"rfq_id": rfq.id, "customer_name": rfq.customer_name, "error": str(e)})
            continue

        after_draft = final_state.quotation_draft or {}
        diff = _diff_against_draft(before["quotation"], before["lines"], after_draft, final_state.grounded_status)

        if diff["changed"]:
            affected.append({"rfq_id": rfq.id, "customer_name": rfq.customer_name, **diff})
        else:
            unaffected_count += 1

    logger.info(
        f"Knowledge refresh: '{filename}' re-indexed; preview shows {len(affected)} of "
        f"{len(preview_candidates)} previewed RFQ(s) would now be quoted differently "
        f"({skipped_count} skipped over the {max_preview_rfqs}-RFQ preview limit)."
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
        "skipped_count": skipped_count,
    }
