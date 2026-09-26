from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class CitationSchema(BaseModel):
    field_name: str
    source_filename: str
    source_chunk_id: str
    evidence_snippet: str
    retrieval_score: float = 0.0

class LineItemSchema(BaseModel):
    id: Optional[str] = None
    product_code: str
    product_name: str
    material_grade: Optional[str] = None
    quantity: int
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    confidence_score: float = 0.0
    status: str = "verified" # verified, unverified, abstained
    citations: List[CitationSchema] = []

class ApprovalActionRequest(BaseModel):
    action: str # APPROVED, REJECTED, REQUEST_CHANGES
    notes: Optional[str] = None

class ApprovalSchema(BaseModel):
    id: str
    action: str
    approver_name: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QuotationResponse(BaseModel):
    id: str
    rfq_id: str
    quotation_number: str
    customer_name: str
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    status: str # PENDING_APPROVAL, APPROVED, REJECTED, CLARIFICATION_REQUIRED
    overall_confidence: float = 0.0
    grounded_status: str # GROUNDED, UNVERIFIED, ABSTAINED
    clarification_questions: Optional[List[str]] = []
    escalation_notes: Optional[str] = None
    created_at: datetime
    line_items: List[LineItemSchema] = []
    approvals: List[ApprovalSchema] = []

    model_config = ConfigDict(from_attributes=True)
