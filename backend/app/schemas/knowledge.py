from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DocumentChunkSchema(BaseModel):
    id: str
    chunk_index: int
    content: str
    metadata_json: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

class KnowledgeDocumentResponse(BaseModel):
    id: str
    filename: str
    document_type: str # catalog, pricing, policy, faq, quotation
    chunks_count: int
    indexed_status: str
    file_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    document_type: str
    chunks_created: int
    indexed_status: str
    message: str
