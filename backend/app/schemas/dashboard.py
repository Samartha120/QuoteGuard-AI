from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DashboardSummaryResponse(BaseModel):
    total_rfqs: int = 0
    quotations_generated: int = 0
    pending_approvals: int = 0
    clarification_cases: int = 0
    grounded_output_percentage: float = 0.0
    average_processing_time_sec: float = 0.0
    estimated_cost_usd: float = 0.0

class ActivityFeedItem(BaseModel):
    id: str
    rfq_id: str
    agent_name: str
    action: str
    timestamp: datetime
    status: str
