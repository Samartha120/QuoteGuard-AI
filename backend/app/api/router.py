from fastapi import APIRouter, Depends
from app.api.routes import health, rfqs, knowledge, quotations, dashboard, evaluation, auth
from app.api.deps import get_current_user

api_router = APIRouter()

# Public routes
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Protected routes (require a valid JWT)
_protected = [Depends(get_current_user)]
api_router.include_router(rfqs.router, prefix="/rfqs", tags=["RFQs"], dependencies=_protected)
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"], dependencies=_protected)
api_router.include_router(quotations.router, prefix="/quotations", tags=["Quotations"], dependencies=_protected)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"], dependencies=_protected)
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"], dependencies=_protected)
