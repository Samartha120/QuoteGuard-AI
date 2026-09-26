from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
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
