import os
from sqlalchemy.orm import Session
from app.db.models import KnowledgeDocument, DocumentChunk, Company
from app.rag.loader import process_and_chunk_file
from app.rag.vector_store import vector_store
from app.core.logging import logger

def ingest_document_file(db: Session, file_path: str, filename: str, doc_type: str, company_id: str) -> KnowledgeDocument:
    """Ingests a document file into relational database and ChromaDB vector store."""
    doc_record = KnowledgeDocument(
        company_id=company_id,
        filename=filename,
        document_type=doc_type,
        file_path=file_path,
        indexed_status="pending"
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    try:
        chunks_data = process_and_chunk_file(
            file_path=file_path,
            filename=filename,
            doc_id=doc_record.id,
            doc_type=doc_type
        )

        db_chunks = []
        for c in chunks_data:
            chunk_obj = DocumentChunk(
                document_id=doc_record.id,
                chunk_index=c["metadata"]["chunk_index"],
                content=c["content"],
                metadata_json=c["metadata"]
            )
            db_chunks.append(chunk_obj)

        db.add_all(db_chunks)
        doc_record.chunks_count = len(chunks_data)
        doc_record.indexed_status = "indexed"
        db.commit()

        # Add to vector store
        vector_store.add_documents(chunks_data)
        logger.info(f"Successfully ingested '{filename}' with {len(chunks_data)} chunks.")
        return doc_record

    except Exception as e:
        logger.error(f"Failed to ingest document '{filename}': {e}")
        doc_record.indexed_status = "failed"
        db.commit()
        raise e
