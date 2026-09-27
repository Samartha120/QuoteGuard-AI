from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class EvaluationRunRequest(BaseModel):
    dataset_name: Optional[str] = "test_dataset.json"

class EvaluationRunResponse(BaseModel):
    id: str
    run_timestamp: datetime
    grounding_rate: float
    hallucination_rate: float
    abstention_accuracy: float
    requirement_extraction_accuracy: float
    retrieval_precision: float
    avg_latency_ms: float
    estimated_api_cost: float
    summary_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class SeriesPoint(BaseModel):
    date: str
    value: float


class DistributionSlice(BaseModel):
    label: str
    value: int


class AgentSuccessRate(BaseModel):
    agent: str
    success_rate: float
    runs: int


class EvaluationAnalyticsResponse(BaseModel):
    has_data: bool
    filters: Dict[str, Any]
    headline: Dict[str, Any]
    time_series: Dict[str, List[SeriesPoint]]
    grounding_distribution: List[DistributionSlice]
    agent_success_rates: List[AgentSuccessRate]

