from sqlalchemy.orm import Session
from app.db.models import RFQ, RFQRequirement, Quotation, QuotationLineItem, AgentRun, Company
from app.schemas.rfq import RFQCreate
from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator
import uuid

def create_rfq(db: Session, rfq_in: RFQCreate, company_id: str = "comp_vertex_001") -> RFQ:
    rfq = RFQ(
        company_id=company_id,
        customer_name=rfq_in.customer_name,
        raw_text=rfq_in.raw_text,
        file_name=rfq_in.file_name,
        status="DRAFT"
    )
    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    return rfq

def get_all_rfqs(db: Session) -> list[RFQ]:
    return db.query(RFQ).order_by(RFQ.created_at.desc()).all()

def get_rfq_by_id(db: Session, rfq_id: str) -> RFQ:
    return db.query(RFQ).filter(RFQ.id == rfq_id).first()

def process_rfq_workflow(db: Session, rfq_id: str) -> RFQ:
    rfq = get_rfq_by_id(db, rfq_id)
    if not rfq:
        raise ValueError(f"RFQ {rfq_id} not found")

    rfq.status = "PROCESSING"
    db.commit()

    initial_state = AgentState(
        rfq_id=rfq.id,
        raw_text=rfq.raw_text,
        customer_name=rfq.customer_name
    )

    final_state = workflow_orchestrator.run_pipeline(initial_state)

    # Save Agent Traces to DB
    for trace in final_state.agent_traces:
        run_record = AgentRun(
            rfq_id=rfq.id,
            agent_name=trace["agent_name"],
            status=trace["status"],
            output_summary=trace["output_summary"],
            execution_time_ms=trace["execution_time_ms"]
        )
        db.add(run_record)

    # Save Extracted Requirements
    req_items = final_state.extracted_requirements.get("line_items", [])
    for item in req_items:
        db_req = RFQRequirement(
            rfq_id=rfq.id,
            product_name=item.get("product_name", ""),
            requested_spec=item.get("requested_spec", ""),
            quantity=item.get("quantity", 1),
            status=item.get("status", "verified")
        )
        db.add(db_req)

    # Save Quotation / Clarification Draft
    draft = final_state.quotation_draft
    quot_number = f"QG-2026-{uuid.uuid4().hex[:6].upper()}"
    
    quotation = Quotation(
        rfq_id=rfq.id,
        quotation_number=quot_number,
        customer_name=final_state.customer_name,
        subtotal=draft.get("subtotal", 0.0),
        tax_amount=draft.get("tax_amount", 0.0),
        total_amount=draft.get("total_amount", 0.0),
        status=draft.get("status", "PENDING_APPROVAL"),
        overall_confidence=final_state.overall_confidence,
        grounded_status=final_state.grounded_status,
        clarification_questions=final_state.clarification_questions,
        escalation_notes=final_state.escalation_notes
    )
    db.add(quotation)
    db.commit()
    db.refresh(quotation)

    # Save Line Items
    for line in draft.get("line_items", []):
        db_line = QuotationLineItem(
            quotation_id=quotation.id,
            product_code=line.get("product_code", ""),
            product_name=line.get("product_name", ""),
            material_grade=line.get("material_grade", ""),
            quantity=line.get("quantity", 1),
            unit_price=line.get("unit_price"),
            total_price=line.get("total_price"),
            confidence_score=line.get("confidence_score", 0.0),
            status=line.get("status", "verified"),
            citations=line.get("citations", [])
        )
        db.add(db_line)

    rfq.status = final_state.grounded_status
    db.commit()
    db.refresh(rfq)
    return rfq
