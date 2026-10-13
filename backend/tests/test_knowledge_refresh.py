"""Knowledge-base refresh: re-indexing a new catalogue/pricing document and PREVIEWING what
every existing RFQ's quotation would look like against it, without writing anything to the
database for those RFQs. Uses a throwaway in-memory database (same pattern as
test_customer_memory.py) and fakes for ingest_document_file / workflow_orchestrator.run_pipeline
so these run without real file parsing, a vector store, or an LLM.

Vedant's review on PR #24 found the original version called process_rfq_workflow(), which
inserts a real new Quotation row per RFQ — silently replacing approved quotes and feeding
customer memory just from uploading a document. These tests pin down the fix: the pipeline
runs in memory (patching workflow_orchestrator.run_pipeline, exactly like
test_evaluation_service tests patch it) and the database is asserted unchanged afterward."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.agents.state import AgentState
from app.db.models import KnowledgeDocument, Quotation, QuotationLineItem, RFQ
from app.db.session import Base
from app.services import knowledge_refresh_service as refresh_svc


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as s:
        yield s


def _add_rfq_with_quotation(db, customer="Apex Engineering", total=50_000.0, grounded="GROUNDED",
                             line_items=(("IV-200", 2500.0, "verified"),)):
    rfq = RFQ(customer_name=customer, raw_text="rfq text", status="GROUNDED")
    db.add(rfq)
    db.flush()
    q = Quotation(rfq_id=rfq.id, quotation_number=f"QG-{rfq.id[:6]}", customer_name=customer,
                  total_amount=total, grounded_status=grounded)
    db.add(q)
    db.flush()
    for code, price, status in line_items:
        db.add(QuotationLineItem(quotation_id=q.id, product_code=code, product_name=code,
                                  quantity=1, unit_price=price, status=status))
    db.commit()
    return rfq


def _fake_doc(doc_id="doc1", filename="new_catalog.md", doc_type="catalog", chunks=5):
    return SimpleNamespace(id=doc_id, filename=filename, document_type=doc_type,
                            chunks_count=chunks, indexed_status="indexed")


def _fake_pipeline_result(total_amount, grounded_status, line_items):
    """Builds a fake AgentState the way workflow_orchestrator.run_pipeline would return it,
    without ever touching the database — the preview must work purely off this."""
    def _run(state: AgentState) -> AgentState:
        state.grounded_status = grounded_status
        state.quotation_draft = {
            "total_amount": total_amount,
            "line_items": [
                {"product_code": code, "product_name": code, "unit_price": price, "status": status}
                for code, price, status in line_items
            ],
        }
        return state
    return _run


def test_reindexes_the_document_and_reports_it(db):
    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()) as ingest:
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")
    ingest.assert_called_once()
    assert result["document_id"] == "doc1"
    assert result["chunks_created"] == 5
    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 0
    assert result["skipped_count"] == 0


def test_rfq_with_a_changed_price_is_flagged_as_affected_but_nothing_is_persisted(db):
    rfq = _add_rfq_with_quotation(db, total=5_000.0, line_items=(("IV-200", 2500.0, "verified"),))
    fake_run = _fake_pipeline_result(5_600.0, "GROUNDED", [("IV-200", 2800.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline", side_effect=fake_run):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_pricing.csv", "pricing")

    assert result["unaffected_count"] == 0
    assert len(result["affected_rfqs"]) == 1
    affected = result["affected_rfqs"][0]
    assert affected["rfq_id"] == rfq.id
    assert affected["previous_total_amount"] == 5_000.0
    assert affected["new_total_amount"] == 5_600.0
    change = affected["line_item_changes"][0]
    assert change["product_code"] == "IV-200"
    assert change["old_unit_price"] == 2500.0
    assert change["new_unit_price"] == 2800.0

    # The whole point of the fix: this is a preview. No new Quotation was written, and the
    # RFQ's saved quote is untouched.
    assert db.query(Quotation).filter(Quotation.rfq_id == rfq.id).count() == 1
    saved = db.query(Quotation).filter(Quotation.rfq_id == rfq.id).first()
    assert saved.total_amount == 5_000.0


def test_rfq_with_no_price_change_is_not_flagged(db):
    _add_rfq_with_quotation(db, total=5_000.0, line_items=(("IV-200", 2500.0, "verified"),))
    fake_run = _fake_pipeline_result(5_000.0, "GROUNDED", [("IV-200", 2500.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline", side_effect=fake_run):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "irrelevant_policy.md", "policy")

    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 1


def test_a_newly_groundable_item_is_flagged_even_though_price_was_never_set(db):
    """An item that was abstained before (no unit_price at all) and is now grounded with a
    real price is exactly the case this feature exists for — not just price changes."""
    _add_rfq_with_quotation(db, total=0.0, grounded="ABSTAINED",
                             line_items=(("SS316-VALVE", None, "abstained"),))
    fake_run = _fake_pipeline_result(4_200.0, "GROUNDED", [("SS316-VALVE", 4200.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline", side_effect=fake_run):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    assert len(result["affected_rfqs"]) == 1
    change = result["affected_rfqs"][0]["line_item_changes"][0]
    assert change["old_status"] == "abstained"
    assert change["new_status"] == "verified"
    assert change["old_unit_price"] is None
    assert change["new_unit_price"] == 4200.0


def test_rfq_never_successfully_quoted_before_is_skipped_not_counted(db):
    """An RFQ with no quotation at all (e.g. still DRAFT) has nothing to diff against, so it
    should neither appear as affected nor inflate unaffected_count."""
    rfq_without_quote = RFQ(customer_name="New Co", raw_text="rfq text", status="DRAFT")
    db.add(rfq_without_quote)
    db.commit()

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline") as mock_run:
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    mock_run.assert_not_called()
    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 0


def test_a_failing_preview_run_is_logged_and_does_not_block_the_rest(db):
    ok_rfq = _add_rfq_with_quotation(db, customer="Good Co", total=1_000.0)
    bad_rfq = _add_rfq_with_quotation(db, customer="Bad Co", total=2_000.0)
    good_run = _fake_pipeline_result(1_500.0, "GROUNDED", [("IV-200", 3000.0, "verified")])

    def _flaky_run(state: AgentState) -> AgentState:
        if state.rfq_id == bad_rfq.id:
            raise RuntimeError("LLM provider down")
        return good_run(state)

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline", side_effect=_flaky_run):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    assert len(result["requote_failures"]) == 1
    assert result["requote_failures"][0]["rfq_id"] == bad_rfq.id
    # the good RFQ still got previewed despite the other one failing
    assert any(a["rfq_id"] == ok_rfq.id for a in result["affected_rfqs"])


def test_preview_is_capped_and_reports_how_many_were_skipped(db):
    for i in range(5):
        _add_rfq_with_quotation(db, customer=f"Customer {i}", total=1_000.0)
    fake_run = _fake_pipeline_result(1_000.0, "GROUNDED", [("IV-200", 2500.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc.workflow_orchestrator, "run_pipeline", side_effect=fake_run) as run:
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog",
                                                      max_preview_rfqs=2)

    assert run.call_count == 2
    assert result["skipped_count"] == 3


def test_refreshing_replaces_the_earlier_document_of_the_same_type(db):
    old_doc = KnowledgeDocument(filename="old_catalog.md", document_type="catalog",
                                 file_path="/tmp/old.md", indexed_status="indexed", chunks_count=3)
    other_type_doc = KnowledgeDocument(filename="policy.md", document_type="policy",
                                        file_path="/tmp/policy.md", indexed_status="indexed", chunks_count=2)
    db.add_all([old_doc, other_type_doc])
    db.commit()
    old_doc_id = old_doc.id

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc(doc_id="new1")), \
         patch.object(refresh_svc, "delete_document") as mock_delete:
        refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    mock_delete.assert_called_once_with(db, old_doc_id)
