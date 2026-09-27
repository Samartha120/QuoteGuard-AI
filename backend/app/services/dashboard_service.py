from sqlalchemy.orm import Session
from app.db.models import RFQ, Quotation, AgentRun

def get_dashboard_summary(db: Session):
    total_rfqs = db.query(RFQ).count()
    total_quotations = db.query(Quotation).count()
    pending_approvals = db.query(Quotation).filter(Quotation.status == "PENDING_APPROVAL").count()
    clarification_cases = db.query(Quotation).filter(Quotation.status == "CLARIFICATION_REQUIRED").count()

    grounded_count = db.query(Quotation).filter(Quotation.grounded_status == "GROUNDED").count()
    grounding_rate = round((grounded_count / total_quotations * 100.0), 1) if total_quotations > 0 else 0.0

    # Real average end-to-end pipeline latency: mean over RFQs of the summed
    # agent-run execution time for that RFQ (ms → sec).
    per_rfq_ms: dict[str, int] = {}
    for run in db.query(AgentRun).all():
        per_rfq_ms[run.rfq_id] = per_rfq_ms.get(run.rfq_id, 0) + (run.execution_time_ms or 0)
    avg_processing_sec = round(sum(per_rfq_ms.values()) / len(per_rfq_ms) / 1000.0, 2) if per_rfq_ms else 0.0

    return {
        "total_rfqs": total_rfqs,
        "quotations_generated": total_quotations,
        "pending_approvals": pending_approvals,
        "clarification_cases": clarification_cases,
        "grounded_output_percentage": grounding_rate,
        "average_processing_time_sec": avg_processing_sec,
        "estimated_cost_usd": 0.0
    }

def get_activity_feed(db: Session, limit: int = 10):
    runs = db.query(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit).all()
    feed = []
    for r in runs:
        feed.append({
            "id": r.id,
            "rfq_id": r.rfq_id,
            "agent_name": r.agent_name,
            "action": r.output_summary or "Executed step",
            "timestamp": r.created_at,
            "status": r.status
        })
    return feed
