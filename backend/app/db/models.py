from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, default="Vertex Industrial Supplies Pvt. Ltd.")
    created_at = Column(DateTime, default=utc_now)
    
    users = relationship("User", back_populates="company")
    documents = relationship("KnowledgeDocument", back_populates="company")
    rfqs = relationship("RFQ", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="sales_manager") # sales_manager, admin
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company", back_populates="users")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    filename = Column(String, nullable=False)
    document_type = Column(String, nullable=False) # catalog, pricing, policy, faq, quotation
    chunks_count = Column(Integer, default=0)
    indexed_status = Column(String, default="indexed") # pending, indexed, failed
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    company = relationship("Company", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("knowledge_documents.id"))
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    document = relationship("KnowledgeDocument", back_populates="chunks")

class RFQ(Base):
    __tablename__ = "rfqs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    raw_text = Column(Text, nullable=False)
    status = Column(String, default="DRAFT") # DRAFT, PROCESSING, GROUNDED, CLARIFICATION_REQUIRED, COMPLETED
    created_at = Column(DateTime, default=utc_now)
    
    company = relationship("Company", back_populates="rfqs")
    requirements = relationship("RFQRequirement", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="rfq", cascade="all, delete-orphan")

class RFQRequirement(Base):
    __tablename__ = "rfq_requirements"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    product_name = Column(String, nullable=False)
    requested_spec = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, default="verified") # verified, missing, ambiguous, conflicting
    created_at = Column(DateTime, default=utc_now)
    
    rfq = relationship("RFQ", back_populates="requirements")

class Quotation(Base):
    __tablename__ = "quotations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    quotation_number = Column(String, unique=True, nullable=False)
    customer_name = Column(String, nullable=False)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, REJECTED, CLARIFICATION_REQUIRED
    overall_confidence = Column(Float, default=0.0)
    grounded_status = Column(String, default="GROUNDED") # GROUNDED, UNVERIFIED, ABSTAINED
    clarification_questions = Column(JSON, nullable=True)
    escalation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    rfq = relationship("RFQ", back_populates="quotations")
    line_items = relationship("QuotationLineItem", back_populates="quotation", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="quotation", cascade="all, delete-orphan")

class QuotationLineItem(Base):
    __tablename__ = "quotation_line_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quotation_id = Column(String, ForeignKey("quotations.id"))
    product_code = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    material_grade = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)
    confidence_score = Column(Float, default=0.0)
    status = Column(String, default="verified") # verified, unverified, abstained
    citations = Column(JSON, nullable=True) # list of citation dicts
    
    quotation = relationship("Quotation", back_populates="line_items")

class SourceCitation(Base):
    __tablename__ = "source_citations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    line_item_id = Column(String, ForeignKey("quotation_line_items.id"))
    field_name = Column(String, nullable=False) # e.g., unit_price, specification
    source_filename = Column(String, nullable=False)
    source_chunk_id = Column(String, nullable=False)
    evidence_snippet = Column(Text, nullable=False)
    retrieval_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

class AgentRun(Base):
    __tablename__ = "agent_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    rfq_id = Column(String, ForeignKey("rfqs.id"))
    agent_name = Column(String, nullable=False) # requirement, retrieval, planning, validation, drafting
    status = Column(String, nullable=False) # STARTED, SUCCESS, WARNING, FAILED
    output_summary = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    
    rfq = relationship("RFQ", back_populates="agent_runs")

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quotation_id = Column(String, ForeignKey("quotations.id"))
    action = Column(String, nullable=False) # APPROVED, REJECTED, REQUEST_CHANGES
    approver_name = Column(String, default="Human Sales Manager")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    quotation = relationship("Quotation", back_populates="approvals")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    run_timestamp = Column(DateTime, default=utc_now)
    grounding_rate = Column(Float, default=0.0)
    hallucination_rate = Column(Float, default=0.0)
    abstention_accuracy = Column(Float, default=0.0)
    requirement_extraction_accuracy = Column(Float, default=0.0)
    retrieval_precision = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)
    estimated_api_cost = Column(Float, default=0.0)
    summary_json = Column(JSON, nullable=True)
