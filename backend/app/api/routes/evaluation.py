from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.evaluation import (
    EvaluationRunResponse,
    EvaluationRunRequest,
    EvaluationAnalyticsResponse,
)
from app.services.evaluation_service import (
    run_evaluation_benchmark,
    get_latest_evaluation_summary,
    get_evaluation_analytics,
    list_evaluation_runs,
)

router = APIRouter()

@router.post("/run", response_model=EvaluationRunResponse)
def execute_evaluation(req: EvaluationRunRequest = None, db: Session = Depends(get_db)):
    return run_evaluation_benchmark(db=db)

@router.get("/summary", response_model=EvaluationRunResponse)
def evaluation_summary(db: Session = Depends(get_db)):
    return get_latest_evaluation_summary(db=db)

@router.get("/analytics", response_model=EvaluationAnalyticsResponse)
def evaluation_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer: Optional[str] = Query(None),
    agent: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return get_evaluation_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        customer=customer,
        agent=agent,
    )

@router.get("/runs", response_model=List[EvaluationRunResponse])
def evaluation_runs(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    return list_evaluation_runs(db=db, limit=limit)

