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

    # Retry/handoff messages addressed to an agent, in order, e.g.
    #   {"step", "from", "to", "type": task|result|error, "content"}
    # Currently only populated in tests / a future retry mechanism; the
    # orchestrator/critic agents that originally wrote these were reverted
    # from main, but the Retrieval Agent still reads this list to pick up
    # a retry reason if one is ever placed here.
    messages: List[Dict[str, Any]] = Field(default_factory=list)
