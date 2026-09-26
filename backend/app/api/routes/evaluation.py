from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.evaluation import EvaluationRunResponse, EvaluationRunRequest
from app.services.evaluation_service import run_evaluation_benchmark, get_latest_evaluation_summary

router = APIRouter()

@router.post("/run", response_model=EvaluationRunResponse)
def execute_evaluation(req: EvaluationRunRequest = None, db: Session = Depends(get_db)):
    return run_evaluation_benchmark(db=db)

@router.get("/summary", response_model=EvaluationRunResponse)
def evaluation_summary(db: Session = Depends(get_db)):
    return get_latest_evaluation_summary(db=db)
