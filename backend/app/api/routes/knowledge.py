from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.knowledge import KnowledgeDocumentResponse, DocumentUploadResponse
from app.services.knowledge_service import get_all_documents, upload_knowledge_document, delete_document
from app.utils.file_utils import save_uploaded_file

router = APIRouter()

@router.get("/documents", response_model=List[KnowledgeDocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return get_all_documents(db=db)

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    document_type: str = Form(...), # catalog, pricing, policy, faq
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = file.file.read()
        file_path = save_uploaded_file(content, file.filename)
        doc = upload_knowledge_document(
            db=db,
            file_path=file_path,
            filename=file.filename,
            doc_type=document_type
        )
        return {
            "document_id": doc.id,
            "filename": doc.filename,
            "document_type": doc.document_type,
            "chunks_created": doc.chunks_count,
            "indexed_status": doc.indexed_status,
            "message": "Document successfully ingested and indexed into vector database."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document ingestion failed: {str(e)}")

@router.delete("/documents/{document_id}")
def remove_document(document_id: str, db: Session = Depends(get_db)):
    success = delete_document(db=db, document_id=document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}
