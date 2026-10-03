from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class AgentState(BaseModel):
    # Basic RFQ Information
    rfq_id: str
    raw_text: str
    customer_name: str = ""
    customer_email: Optional[str] = None

    # ============================================================
    # Stage 1: Extracted Requirements
    # ============================================================
    extracted_requirements: Dict[str, Any] = Field(default_factory=dict)

    # ============================================================
    # Stage 2: Retrieved Evidence
    # ============================================================
    retrieved_evidence: List[Dict[str, Any]] = Field(default_factory=list)

    # ============================================================
    # Stage 3 & 4: Planning / Validation Output
    # ============================================================
    field_confidences: Dict[str, float] = Field(default_factory=dict)

    grounded_status: str = "PENDING"
    # Possible values:
    # PENDING
    # GROUNDED
    # UNVERIFIED
    # ABSTAINED

    overall_confidence: float = 0.0

    abstention_required: bool = False

    # ============================================================
    # Stage 5: Drafting Output
    # ============================================================
    quotation_draft: Dict[str, Any] = Field(default_factory=dict)

    clarification_questions: List[str] = Field(default_factory=list)

    escalation_notes: Optional[str] = None

    # ============================================================
    # Critic / Revision Loop
    # ============================================================
    critic_feedback: Dict[str, Any] = Field(default_factory=dict)

    revision_count: int = 0

    # ============================================================
    # Orchestrator Decision History
    # ============================================================
    orchestrator_decisions: List[Dict[str, Any]] = Field(
        default_factory=list
    )

    # ============================================================
    # Execution Trace / Audit Trail
    # ============================================================
    agent_traces: List[Dict[str, Any]] = Field(default_factory=list)