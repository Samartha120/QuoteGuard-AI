from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.knowledge import KnowledgeDocumentResponse, DocumentUploadResponse, DocumentChunkSchema
from app.services.knowledge_service import get_all_documents, upload_knowledge_document, delete_document, get_document_chunks
from app.utils.file_utils import save_uploaded_file
from app.core.input_validation import validate_upload, InputError
from app.core.logging import logger
from app.api.deps import require_roles

router = APIRouter()

ALLOWED_DOC_TYPES = {"catalog", "pricing", "policy", "faq", "quotation"}


@router.get("/documents", response_model=List[KnowledgeDocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return get_all_documents(db=db)


@router.get("/documents/{document_id}/chunks", response_model=List[DocumentChunkSchema])
def list_document_chunks(document_id: str, db: Session = Depends(get_db)):
    return get_document_chunks(db=db, document_id=document_id)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("sales_manager", "admin"))],
)
def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    doc_type_clean = document_type.strip().lower()
    if doc_type_clean not in ALLOWED_DOC_TYPES:
        allowed_str = ", ".join(sorted(ALLOWED_DOC_TYPES))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid document type '{document_type}'. Allowed: {allowed_str}.",
        )

    try:
        content = file.file.read()
        validate_upload(file.filename, content)
        file_path = save_uploaded_file(content, file.filename)
        doc = upload_knowledge_document(
            db=db,
            file_path=file_path,
            filename=file.filename,
            doc_type=doc_type_clean,
        )
        return {
            "document_id": doc.id,
            "filename": doc.filename,
            "document_type": doc.document_type,
            "chunks_created": doc.chunks_count,
            "indexed_status": doc.indexed_status,
            "message": "Document successfully ingested and indexed into vector database.",
        }
    except InputError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        logger.exception(f"Document ingestion failed for {file.filename}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Document ingestion failed. Please verify the document format and try again.",
        )


@router.delete(
    "/documents/{document_id}",
    dependencies=[Depends(require_roles("sales_manager", "admin"))],
)
def remove_document(document_id: str, db: Session = Depends(get_db)):
    success = delete_document(db=db, document_id=document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}
