from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class RequirementExtracted(BaseModel):
    product_name: str
    product_code: Optional[str] = None
    requested_spec: Optional[str] = None
    quantity: int = 1
    material_grade: Optional[str] = None
    status: str = "verified" # verified, missing, ambiguous, conflicting

class RFQCreate(BaseModel):
    customer_name: str
    raw_text: str
    file_name: Optional[str] = None

class AgentRunSchema(BaseModel):
    id: str
    agent_name: str
    status: str
    output_summary: Optional[str] = None
    execution_time_ms: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RFQResponse(BaseModel):
    id: str
    customer_name: str
    customer_email: Optional[str] = None
    file_name: Optional[str] = None
    raw_text: str
    status: str
    created_at: datetime
    requirements: List[RequirementExtracted] = []
    agent_runs: List[AgentRunSchema] = []

    model_config = ConfigDict(from_attributes=True)
