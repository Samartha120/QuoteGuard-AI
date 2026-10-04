from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AgentState(BaseModel):
    rfq_id: str
    raw_text: str
    customer_name: str = ""
    customer_email: Optional[str] = None
    
    # Stage 1: Extracted Requirements
    extracted_requirements: Dict[str, Any] = Field(default_factory=dict)
    
    # Stage 2: Retrieved Evidence
    retrieved_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Stage 3 & 4: Validation & Planning Output
    field_confidences: Dict[str, float] = Field(default_factory=dict)
    grounded_status: str = "PENDING" # GROUNDED, UNVERIFIED, ABSTAINED
    overall_confidence: float = 0.0
    abstention_required: bool = False
    
    # Stage 5: Drafting Output
    quotation_draft: Dict[str, Any] = Field(default_factory=dict)
    clarification_questions: List[str] = Field(default_factory=list)
    escalation_notes: Optional[str] = None
    
    # Execution Trace Audit Trail
    agent_traces: List[Dict[str, Any]] = Field(default_factory=list)

    # Per-tool-call log from the Retrieval Agent's LLM-selected plan
    # (which tool, what query, how many results) — kept separate from
    # agent_traces so the one-entry-per-stage trace count is unaffected.
    tool_call_log: List[Dict[str, Any]] = Field(default_factory=list)
