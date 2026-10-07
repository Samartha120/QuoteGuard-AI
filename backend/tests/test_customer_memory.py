"""Customer memory: the lookup against a throwaway database with real RFQ / Quotation
rows, and how the Validation & Planning agent uses it."""
import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.agents import validation_planning_agent as vpa
from app.agents.state import AgentState
from app.db.models import RFQ, Quotation, QuotationLineItem
from app.db.session import Base
from app.llm.client import llm_client
from app.tools import customer_memory as cm


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    yield Session


def add_history(Session, customer, statuses, codes=("IV-200",), escalated=False):
    with Session() as s:
        for i, status in enumerate(statuses):
            rfq = RFQ(customer_name=customer, raw_text="rfq text", status="GROUNDED")
            s.add(rfq)
            s.flush()
            q = Quotation(rfq_id=rfq.id, quotation_number=f"QG-{customer[:3]}-{i}-{status}",
                          customer_name=customer, total_amount=100_000.0, status=status,
                          escalation_notes="ESCALATED BY ORCHESTRATOR: x" if escalated else None)
            s.add(q)
            s.flush()
            for code in codes:
                s.add(QuotationLineItem(quotation_id=q.id, product_code=code, product_name=code, quantity=1))
        s.commit()


# ---- the lookup ---------------------------------------------------------------

@pytest.mark.parametrize("a,b", [
    ("Apex Engineering Works Ltd.", "APEX ENGINEERING WORKS PVT LTD"),
    ("The Apex Engineering Works Limited", "apex engineering works"),
])
def test_customer_names_match_despite_suffixes(a, b):
    assert cm.normalize_customer(a) == cm.normalize_customer(b)


def test_returning_customer_with_approved_quotes(db):
    add_history(db, "Apex Engineering Works Ltd.", ["APPROVED", "APPROVED", "REJECTED"], codes=("IV-200", "PV-100"))
    add_history(db, "Someone Else Pvt Ltd", ["APPROVED"])
    m = cm.lookup_customer_history("APEX ENGINEERING WORKS PVT LTD", session_factory=db)
    assert m["found"] and m["established"]
    assert (m["past_rfqs"], m["approved_quotations"], m["rejected_quotations"]) == (3, 2, 1)
    assert m["products_bought"] == ["IV-200", "PV-100"]
    assert m["approved_value_inr"] == 200_000.0
    assert "returning customer" in cm.describe(m)


def test_the_rfq_being_processed_is_not_its_own_history(db):
    add_history(db, "Apex Engineering Works Ltd.", ["PENDING_APPROVAL"])
    with db() as s:
        only_id = s.query(RFQ).one().id
    assert not cm.lookup_customer_history("Apex Engineering Works", exclude_rfq_id=only_id,
                                          session_factory=db)["found"]


def test_new_customer(db):
    m = cm.lookup_customer_history("Brand New Industries", session_factory=db)
    assert not m["found"] and cm.describe(m).startswith("new customer")


def test_database_failure_is_survivable():
    def broken():
        raise RuntimeError("database locked")
    m = cm.lookup_customer_history("Apex", session_factory=broken)
    assert m["found"] is False and "database locked" in m["error"]
    assert cm.describe(m) == "customer history unavailable"


# ---- Validation & Planning uses it ---------------------------------------------

RFQ_TEXT = "Please quote Industrial Valve IV-200, 20 units. Payment: Net 30 days. Ex-works Pune."
ACCOUNT_Q = {"item": "payment", "kind": "ambiguous", "resolver": "internal",
             "detail": "Net 30 is only for credit-approved customers; approval status not stated",
             "rfq_quote": "Payment: Net 30 days"}


def run_vp(monkeypatch, memory, llm_issues=None, payment="Net 30 days"):
    monkeypatch.setattr(vpa, "lookup_customer_history", lambda name, exclude_rfq_id=None: memory)
    if llm_issues is not None:
        monkeypatch.setattr(llm_client, "demo_mode", False)
        monkeypatch.setattr(llm_client, "generate_completion", lambda system_prompt, user_prompt:
                            json.dumps({"blocks_quote": True} if "blocks_quote" in user_prompt
                                       else {"issues": llm_issues}))
    else:
        monkeypatch.setattr(llm_client, "demo_mode", True)
    state = AgentState(rfq_id="r", raw_text=RFQ_TEXT, customer_name="Apex Engineering Works Ltd.",
                       retrieved_evidence=[{"chunk_id": "c", "score": 0.95, "content": "IV-200 SS304",
                                            "metadata": {"doc_type": "catalog"}}],
                       extracted_requirements={"payment_terms": payment, "line_items": [
                           {"product_name": "Industrial Valve IV-200", "product_code": "IV-200",
                            "material_grade": "SS304", "quantity": 20}]})
    return vpa.run_validation_planning_agent(state)


ESTABLISHED = {"found": True, "established": True, "past_rfqs": 3, "approved_quotations": 2,
               "rejected_quotations": 0, "escalated_quotations": 0, "last_approved": "2026-09-30",
               "products_bought": ["IV-200"]}


def test_established_customer_is_not_asked_about_credit_approval(monkeypatch):
    s = run_vp(monkeypatch, ESTABLISHED, [ACCOUNT_Q])
    assert s.validation_plan["decision"] == "proceed"
    assert "returning customer" in s.validation_plan["customer"]


def test_new_customer_still_gets_the_credit_question(monkeypatch):
    s = run_vp(monkeypatch, {"found": False}, [ACCOUNT_Q])
    assert s.validation_plan["decision"] == "escalate"


def test_memory_lookup_is_a_tool_call_in_the_trace(monkeypatch):
    s = run_vp(monkeypatch, ESTABLISHED)
    tool = [m for m in s.messages if m["type"] == "tool"]
    assert tool and tool[0]["to"] == "customer_memory" and "2 approved" in tool[0]["content"]


def test_long_credit_still_needs_finance_but_says_who_is_asking(monkeypatch):
    s = run_vp(monkeypatch, ESTABLISHED, payment="Net 60 days")
    credit = [i for i in s.validation_plan["issues"] if i["item"] == "payment terms"][0]
    assert credit["resolver"] == "internal" and "returning customer" in credit["detail"]


def test_customer_whose_quotes_never_succeed_gets_an_advisory(monkeypatch):
    poor = {"found": True, "established": False, "past_rfqs": 3, "approved_quotations": 0,
            "rejected_quotations": 2, "escalated_quotations": 1}
    s = run_vp(monkeypatch, poor)
    assert s.validation_plan["decision"] == "proceed"   # history alone never blocks
    assert any(a["item"] == "customer history" for a in s.validation_plan["advisories"])
