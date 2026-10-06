"""Bad input, end to end: the validation rules, the RFQ API's responses (with a
throwaway database and a stand-in user), and the clean-up of extracted requirements."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.agents import orchestrator
from app.agents.state import AgentState
from app.api.deps import get_current_user
from app.core import input_validation as iv
from app.db.models import RFQ
from app.db.session import Base, get_db
from app.main import app

GOOD_RFQ = "Please quote Industrial Valve IV-200, 20 units, SS304, PN16. Net 30 days, ex-works Pune."


# ---- text rules ---------------------------------------------------------------

@pytest.mark.parametrize("text,why", [
    ("", "empty"),
    ("   \n\t ", "empty"),
    ("need valves", "too short"),
    ("asdf qwrt zxcv bnmm kjhg lpoi", "does not look like readable language"),
    ("%PDF-1.7 0 0 0 obj <<>> 1 2 3 4 5 6 7 8 9 %%EOF \x00\x01\x02", "does not look like readable language"),
    ("x " * 15_000, "limit"),
])
def test_bad_rfq_text_is_rejected_with_a_reason(text, why):
    with pytest.raises(iv.InputError, match=why):
        iv.validate_rfq_text(text)


def test_good_rfq_text_passes_and_is_trimmed():
    assert iv.validate_rfq_text(f"  {GOOD_RFQ}\x00 ") == GOOD_RFQ


@pytest.mark.parametrize("name,ok", [("Apex Engineering", True), ("   ", False), ("x" * 201, False)])
def test_customer_name(name, ok):
    if ok:
        assert iv.validate_customer_name(f"  {name}  ") == name
    else:
        with pytest.raises(iv.InputError):
            iv.validate_customer_name(name)


@pytest.mark.parametrize("filename,content,code", [
    ("rfq.exe", b"MZ...", 415),
    ("rfq", b"hello", 415),
    ("rfq.pdf", b"", 422),
    ("rfq.txt", b"a" * (iv.MAX_UPLOAD_BYTES + 1), 413),
])
def test_bad_uploads_are_rejected(filename, content, code):
    with pytest.raises(iv.InputError) as e:
        iv.validate_upload(filename, content)
    assert e.value.status_code == code


def test_scanned_pdf_gets_a_helpful_message():
    with pytest.raises(iv.InputError, match="scanned image"):
        iv.validate_parsed_upload("   ", "rfq.pdf")


# ---- extracted requirements -----------------------------------------------------

@pytest.mark.parametrize("value,qty,note", [
    (20, 20, None), ("30 units", 30, None), ("1,500", 1500, None), (12.0, 12, None),
    ("around 30 to 40 pieces", None, "range"), ("30-40", None, "range"),
    (0, None, "not positive"), (-5, None, "not positive"), (2.5, None, "whole number"),
    ("a few", None, "not a number"), (None, None, "no quantity"), (True, None, "no quantity"),
    (98_765_432_10, None, "implausibly large"),
])
def test_quantity_coercion(value, qty, note):
    got, why = iv.coerce_quantity(value)
    assert got == qty
    assert (why is None) if note is None else (note in why)


def test_products_the_rfq_never_mentions_are_dropped():
    reqs = {"line_items": [{"product_name": "Industrial Valve", "product_code": "IV-200", "quantity": "20"},
                           {"product_name": "Gate Valve", "product_code": "GV-9", "quantity": 5},
                           {"product_name": "", "quantity": 3}, "garbage"]}
    out, notes = iv.normalize_requirements(reqs, "Need 20 Industrial Valves IV-200 please")
    assert [i["product_code"] for i in out["line_items"]] == ["IV-200"]
    assert out["line_items"][0]["quantity"] == 20
    assert len(notes) == 3


def test_supervisor_cleans_extraction_before_other_agents_see_it(monkeypatch):
    def fake_extraction(s):
        s.extracted_requirements = {"line_items": [
            {"product_name": "Pressure Relief Valve", "quantity": "around 30 to 40 pieces"},
            {"product_name": "Butterfly Valve BV-7", "product_code": "BV-7", "quantity": 10}]}
        return s
    monkeypatch.setattr(orchestrator, "run_requirement_agent", fake_extraction)
    s = orchestrator.extract_and_normalize(
        AgentState(rfq_id="t", raw_text="We need pressure relief valves, around 30 to 40 pieces."))
    items = s.extracted_requirements["line_items"]
    assert len(items) == 1 and items[0]["quantity"] is None
    assert any(m["type"] == "check" and "range" in m["content"] for m in s.messages)


# ---- the API ------------------------------------------------------------------

@pytest.fixture
def api():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def db():
        s = Session()
        try:
            yield s
        finally:
            s.close()
    app.dependency_overrides[get_db] = db
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app), Session
    app.dependency_overrides.clear()


def test_api_rejects_bad_text_with_a_clear_message(api):
    client, _ = api
    r = client.post("/api/rfqs", json={"customer_name": "Apex", "raw_text": "   "})
    assert r.status_code == 422 and "empty" in r.json()["detail"]
    r = client.post("/api/rfqs", json={"customer_name": "Apex", "raw_text": "asdf qwrt zxcv bnmm kjhg lpoi"})
    assert r.status_code == 422 and "readable language" in r.json()["detail"]


def test_api_accepts_a_real_rfq(api):
    client, _ = api
    r = client.post("/api/rfqs", json={"customer_name": "  Apex  ", "raw_text": GOOD_RFQ})
    assert r.status_code == 201 and r.json()["customer_name"] == "Apex"


def test_api_rejects_bad_uploads(api):
    client, _ = api
    r = client.post("/api/rfqs/upload", data={"customer_name": "Apex"},
                    files={"file": ("virus.exe", b"MZ\x90\x00", "application/octet-stream")})
    assert r.status_code == 415 and "Unsupported file type" in r.json()["detail"]
    r = client.post("/api/rfqs/upload", data={"customer_name": "Apex"},
                    files={"file": ("empty.txt", b"", "text/plain")})
    assert r.status_code == 422


def test_failed_processing_marks_the_rfq_failed_and_hides_internals(api, monkeypatch):
    client, Session = api
    rfq_id = client.post("/api/rfqs", json={"customer_name": "Apex", "raw_text": GOOD_RFQ}).json()["id"]

    def boom(**kw):
        raise RuntimeError("database password=hunter2 in traceback")
    monkeypatch.setattr("app.api.routes.rfqs.process_rfq_workflow", boom)
    r = client.post(f"/api/rfqs/{rfq_id}/process")
    assert r.status_code == 500
    assert "hunter2" not in r.text and "FAILED" in r.json()["detail"]
    with Session() as s:
        assert s.get(RFQ, rfq_id).status == "FAILED"
