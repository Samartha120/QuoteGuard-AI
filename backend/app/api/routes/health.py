from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "grounding_threshold": settings.GROUNDING_THRESHOLD
    }
