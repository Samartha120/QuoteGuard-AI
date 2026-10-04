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

    # Critic review of the draft — see app/agents/critic_agent.py
    # {"verdict": approve|revise, "issues": [...], "fix_by": [...], "reviewed_by": [...], "round": n}
    critic_feedback: Dict[str, Any] = Field(default_factory=dict)

    # Execution Trace Audit Trail
    agent_traces: List[Dict[str, Any]] = Field(default_factory=list)

    # Orchestrator (supervisor) bookkeeping — see app/agents/orchestrator.py
    # messages: every handoff between the supervisor and an agent, in order
    #   {"step", "from", "to", "type": task|result|error, "content"}
    # orchestrator_decisions: why the supervisor picked each next agent
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    orchestrator_decisions: List[Dict[str, Any]] = Field(default_factory=list)
    completed_agents: List[str] = Field(default_factory=list)
    attempts: Dict[str, int] = Field(default_factory=dict)
    next_agent: Optional[str] = None
    step: int = 0
