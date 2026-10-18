from fastapi import APIRouter
from app.core.config import settings
from app.llm.client import llm_client

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "grounding_threshold": settings.GROUNDING_THRESHOLD,
        "email_delivery": {
            "configured": bool(settings.SMTP_ENABLED and settings.SMTP_USER and settings.SMTP_PASSWORD),
            "host": settings.SMTP_HOST if settings.SMTP_ENABLED else None,
            "port": settings.SMTP_PORT if settings.SMTP_ENABLED else None,
            "sender": (settings.SMTP_FROM_EMAIL or settings.SMTP_USER) if (settings.SMTP_ENABLED and settings.SMTP_USER) else None,
        },
        # live / degraded (skipping the LLM after failures) / demo. The raw error is left
        # out on purpose: provider errors can include account identifiers.
        "llm": {k: v for k, v in llm_client.status().items() if k != "last_error"},
    }

