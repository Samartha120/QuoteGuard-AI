from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.rfq import RFQCreate, RFQResponse
from app.services.rfq_service import create_rfq, get_all_rfqs, get_rfq_by_id, process_rfq_workflow
from app.utils.file_utils import save_uploaded_file
from app.rag.parser import parse_document

router = APIRouter()

@router.post("", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
def create_new_rfq(rfq_in: RFQCreate, db: Session = Depends(get_db)):
    return create_rfq(db=db, rfq_in=rfq_in)

@router.post("/upload", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
def upload_rfq_file(
    customer_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = file.file.read()
    file_path = save_uploaded_file(content, file.filename)
    raw_text = parse_document(file_path, file.filename)
    
    rfq_in = RFQCreate(
        customer_name=customer_name,
        raw_text=raw_text,
        file_name=file.filename
    )
    return create_rfq(db=db, rfq_in=rfq_in)

@router.get("", response_model=List[RFQResponse])
def list_rfqs(db: Session = Depends(get_db)):
    return get_all_rfqs(db=db)

@router.get("/{rfq_id}", response_model=RFQResponse)
def get_rfq(rfq_id: str, db: Session = Depends(get_db)):
    rfq = get_rfq_by_id(db=db, rfq_id=rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq

@router.post("/{rfq_id}/process", response_model=RFQResponse)
def run_rfq_process(rfq_id: str, db: Session = Depends(get_db)):
    try:
        rfq = process_rfq_workflow(db=db, rfq_id=rfq_id)
        return rfq
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent workflow error: {str(e)}")
