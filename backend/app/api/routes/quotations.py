from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.quotation import QuotationResponse, ApprovalActionRequest
from app.services.quotation_service import (
    get_all_quotations,
    get_quotation_by_id,
    approve_quotation,
    reject_quotation,
    request_changes_quotation,
    build_pdf_file
)

router = APIRouter()

@router.get("", response_model=List[QuotationResponse])
def list_quotations(db: Session = Depends(get_db)):
    return get_all_quotations(db=db)

@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(quotation_id: str, db: Session = Depends(get_db)):
    quot = get_quotation_by_id(db=db, quotation_id=quotation_id)
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quot

@router.post("/{quotation_id}/approve", response_model=QuotationResponse)
def approve(quotation_id: str, req: ApprovalActionRequest = None, db: Session = Depends(get_db)):
    notes = req.notes if req and req.notes else "Approved by Human Sales Manager"
    quot = approve_quotation(db=db, quotation_id=quotation_id, notes=notes)
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quot

@router.post("/{quotation_id}/reject", response_model=QuotationResponse)
def reject(quotation_id: str, req: ApprovalActionRequest = None, db: Session = Depends(get_db)):
    notes = req.notes if req and req.notes else "Rejected by Sales Manager"
    quot = reject_quotation(db=db, quotation_id=quotation_id, notes=notes)
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quot

@router.post("/{quotation_id}/request-changes", response_model=QuotationResponse)
def request_changes(quotation_id: str, req: ApprovalActionRequest, db: Session = Depends(get_db)):
    quot = request_changes_quotation(db=db, quotation_id=quotation_id, notes=req.notes or "Clarification required")
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quot

@router.get("/{quotation_id}/download")
def download_pdf(quotation_id: str, db: Session = Depends(get_db)):
    try:
        pdf_bytes = build_pdf_file(db=db, quotation_id=quotation_id)
        filename = f"Quotation_{quotation_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
