from fastapi import APIRouter
from app.api.routes import health, rfqs, knowledge, quotations, dashboard, evaluation

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(rfqs.router, prefix="/rfqs", tags=["RFQs"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
api_router.include_router(quotations.router, prefix="/quotations", tags=["Quotations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])
