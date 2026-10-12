"""Knowledge-base refresh: re-indexing a new catalogue/pricing document and diffing every
existing RFQ's quotation before vs. after. Uses a throwaway in-memory database (same pattern
as test_customer_memory.py) and fakes for ingest_document_file / process_rfq_workflow so these
run without real file parsing, a vector store, or an LLM."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import RFQ, Quotation, QuotationLineItem
from app.db.session import Base
from app.services import knowledge_refresh_service as refresh_svc


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as s:
        yield s


def _add_rfq_with_quotation(db, customer="Apex Engineering", total=50_000.0,
                             line_items=(("IV-200", 2500.0, "verified"),)):
    rfq = RFQ(customer_name=customer, raw_text="rfq text", status="GROUNDED")
    db.add(rfq)
    db.flush()
    q = Quotation(rfq_id=rfq.id, quotation_number=f"QG-{rfq.id[:6]}", customer_name=customer,
                  total_amount=total, grounded_status="GROUNDED")
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


def _requote_with(db, new_total, new_line_items):
    """Builds a fake process_rfq_workflow that inserts a brand-new Quotation row for the given
    RFQ — simulating a real re-quote without running the actual multi-agent pipeline."""
    def _fake_process(db_arg, rfq_id):
        rfq = db_arg.query(RFQ).filter(RFQ.id == rfq_id).first()
        q = Quotation(rfq_id=rfq_id, quotation_number=f"QG-{rfq_id[:6]}-v2",
                      customer_name=rfq.customer_name, total_amount=new_total, grounded_status="GROUNDED")
        db_arg.add(q)
        db_arg.flush()
        for code, price, status in new_line_items:
            db_arg.add(QuotationLineItem(quotation_id=q.id, product_code=code, product_name=code,
                                          quantity=1, unit_price=price, status=status))
        db_arg.commit()
        return rfq
    return _fake_process


def test_reindexes_the_document_and_reports_it(db):
    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()) as ingest:
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")
    ingest.assert_called_once()
    assert result["document_id"] == "doc1"
    assert result["chunks_created"] == 5
    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 0


def test_rfq_with_a_changed_price_is_flagged_as_affected(db):
    rfq = _add_rfq_with_quotation(db, total=5_000.0, line_items=(("IV-200", 2500.0, "verified"),))
    requote = _requote_with(db, new_total=5_600.0, new_line_items=[("IV-200", 2800.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc, "process_rfq_workflow", side_effect=requote):
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


def test_rfq_with_no_price_change_is_not_flagged(db):
    _add_rfq_with_quotation(db, total=5_000.0, line_items=(("IV-200", 2500.0, "verified"),))
    # Same price, same status, same total: re-quoting the RFQ with an unrelated document
    # shouldn't surface it as "changed."
    requote = _requote_with(db, new_total=5_000.0, new_line_items=[("IV-200", 2500.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc, "process_rfq_workflow", side_effect=requote):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "irrelevant_policy.md", "policy")

    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 1


def test_a_newly_groundable_item_is_flagged_even_though_price_was_never_set(db):
    """An item that was abstained before (no unit_price at all) and is now grounded with a
    real price is exactly the case this feature exists for — not just price changes."""
    _add_rfq_with_quotation(db, total=0.0, line_items=(("SS316-VALVE", None, "abstained"),))
    requote = _requote_with(db, new_total=4_200.0, new_line_items=[("SS316-VALVE", 4200.0, "verified")])

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc, "process_rfq_workflow", side_effect=requote):
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
    RFQ_without_quote = RFQ(customer_name="New Co", raw_text="rfq text", status="DRAFT")
    db.add(RFQ_without_quote)
    db.commit()

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc, "process_rfq_workflow") as mock_requote:
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    mock_requote.assert_not_called()
    assert result["affected_rfqs"] == []
    assert result["unaffected_count"] == 0


def test_a_failing_requote_is_logged_and_does_not_block_the_rest(db):
    ok_rfq = _add_rfq_with_quotation(db, customer="Good Co", total=1_000.0)
    bad_rfq = _add_rfq_with_quotation(db, customer="Bad Co", total=2_000.0)

    def _flaky_requote(db_arg, rfq_id):
        if rfq_id == bad_rfq.id:
            raise RuntimeError("LLM provider down")
        return _requote_with(db_arg, new_total=1_500.0, new_line_items=[("IV-200", 3000.0, "verified")])(db_arg, rfq_id)

    with patch.object(refresh_svc, "ingest_document_file", return_value=_fake_doc()), \
         patch.object(refresh_svc, "process_rfq_workflow", side_effect=_flaky_requote):
        result = refresh_svc.refresh_knowledge_base(db, "/tmp/f.md", "new_catalog.md", "catalog")

    assert len(result["requote_failures"]) == 1
    assert result["requote_failures"][0]["rfq_id"] == bad_rfq.id
    # the good RFQ still got re-quoted and diffed despite the other one failing
    assert any(a["rfq_id"] == ok_rfq.id for a in result["affected_rfqs"])
