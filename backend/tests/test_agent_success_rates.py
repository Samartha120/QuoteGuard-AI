"""Evaluation analytics: agent success rates must not count a quotation agent's ACTION
steps as failed runs, or an orchestrator escalation as a failure."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import RFQ, AgentRun
from app.db.session import Base
from app.services.evaluation_service import get_evaluation_analytics


def test_action_steps_and_escalations_are_not_failures():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        rfq = RFQ(customer_name="Zenith", raw_text="rfq text", status="ABSTAINED")
        db.add(rfq)
        db.flush()
        for name, status in [("Quotation & Communication Agent", "ACTION")] * 4 + [
            ("Quotation & Communication Agent", "SUCCESS"),
            ("Critic Agent", "SUCCESS"),
            ("Orchestrator", "ESCALATED"),
            ("Retrieval Agent", "FAILED"),
        ]:
            db.add(AgentRun(rfq_id=rfq.id, agent_name=name, status=status))
        db.commit()

        rates = {r["agent"]: r for r in get_evaluation_analytics(db)["agent_success_rates"]}

    assert rates["Quotation & Communication Agent"] == {"agent": "Quotation & Communication Agent", "success_rate": 100.0, "runs": 1}
    assert rates["Orchestrator"]["success_rate"] == 100.0
    assert rates["Retrieval Agent"]["success_rate"] == 0.0
