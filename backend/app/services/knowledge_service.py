from sqlalchemy.orm import Session
from app.db.models import KnowledgeDocument, DocumentChunk
from app.rag.ingestion import ingest_document_file
from app.rag.vector_store import vector_store

def get_all_documents(db: Session):
    return db.query(KnowledgeDocument).order_by(KnowledgeDocument.created_at.desc()).all()

def get_document_chunks(db: Session, document_id: str):
    return (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index.asc())
        .all()
    )

def upload_knowledge_document(db: Session, file_path: str, filename: str, doc_type: str, company_id: str = "comp_vertex_001"):
    return ingest_document_file(
        db=db,
        file_path=file_path,
        filename=filename,
        doc_type=doc_type,
        company_id=company_id
    )

def delete_document(db: Session, document_id: str):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if doc:
        vector_store.delete_by_document_id(document_id)
        db.delete(doc)
        db.commit()
        return True
    return False
