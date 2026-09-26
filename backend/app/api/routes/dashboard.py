from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.dashboard import DashboardSummaryResponse, ActivityFeedItem
from app.services.dashboard_service import get_dashboard_summary, get_activity_feed

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def summary(db: Session = Depends(get_db)):
    return get_dashboard_summary(db=db)

@router.get("/activity", response_model=List[ActivityFeedItem])
def activity(db: Session = Depends(get_db)):
    return get_activity_feed(db=db)
