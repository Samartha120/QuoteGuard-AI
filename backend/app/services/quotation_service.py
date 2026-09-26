from sqlalchemy.orm import Session
from app.db.models import Quotation, Approval
from app.utils.pdf_generator import generate_quotation_pdf

def get_all_quotations(db: Session):
    return db.query(Quotation).order_by(Quotation.created_at.desc()).all()

def get_quotation_by_id(db: Session, quotation_id: str):
    return db.query(Quotation).filter(Quotation.id == quotation_id).first()

def approve_quotation(db: Session, quotation_id: str, notes: str = "Approved by Sales Manager"):
    quot = get_quotation_by_id(db, quotation_id)
    if not quot:
        return None
    
    quot.status = "APPROVED"
    approval = Approval(
        quotation_id=quot.id,
        action="APPROVED",
        approver_name="Sales Manager",
        notes=notes
    )
    db.add(approval)
    db.commit()
    db.refresh(quot)
    return quot

def reject_quotation(db: Session, quotation_id: str, notes: str = "Rejected"):
    quot = get_quotation_by_id(db, quotation_id)
    if not quot:
        return None
    
    quot.status = "REJECTED"
    approval = Approval(
        quotation_id=quot.id,
        action="REJECTED",
        approver_name="Sales Manager",
        notes=notes
    )
    db.add(approval)
    db.commit()
    db.refresh(quot)
    return quot

def request_changes_quotation(db: Session, quotation_id: str, notes: str):
    quot = get_quotation_by_id(db, quotation_id)
    if not quot:
        return None
    
    quot.status = "CLARIFICATION_REQUIRED"
    approval = Approval(
        quotation_id=quot.id,
        action="REQUEST_CHANGES",
        approver_name="Sales Manager",
        notes=notes
    )
    db.add(approval)
    db.commit()
    db.refresh(quot)
    return quot

def build_pdf_file(db: Session, quotation_id: str) -> bytes:
    quot = get_quotation_by_id(db, quotation_id)
    if not quot:
        raise ValueError(f"Quotation {quotation_id} not found")
    return generate_quotation_pdf(quot)
