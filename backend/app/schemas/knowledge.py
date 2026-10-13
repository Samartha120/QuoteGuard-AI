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


class LineItemChangeSchema(BaseModel):
    product_code: str
    old_unit_price: Optional[float] = None
    new_unit_price: Optional[float] = None
    old_status: str
    new_status: str


class AffectedRfqSchema(BaseModel):
    rfq_id: str
    customer_name: str
    changed: bool
    previous_total_amount: Optional[float] = None
    new_total_amount: float
    previous_grounded_status: Optional[str] = None
    new_grounded_status: str
    line_item_changes: List[LineItemChangeSchema] = []


class RequoteFailureSchema(BaseModel):
    rfq_id: str
    customer_name: str
    error: str


class KnowledgeRefreshResponse(BaseModel):
    document_id: str
    filename: str
    document_type: str
    chunks_created: int
    indexed_status: str
    affected_rfqs: List[AffectedRfqSchema] = []
    unaffected_count: int = 0
    requote_failures: List[RequoteFailureSchema] = []
    # How many already-quoted RFQs were left out of this preview because there were more of
    # them than the preview limit (see knowledge_refresh_service.DEFAULT_MAX_PREVIEW_RFQS).
    skipped_count: int = 0
