from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.logging import logger
from app.db.init_db import init_db
from app.api.router import api_router
from app.core.middleware import (
    SecurityHeadersMiddleware,
    CSRFProtectionMiddleware,
    RateLimiterMiddleware,
    RequestTrackingMiddleware,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing QuoteGuard AI Database and Core Services...")
    init_db()
    
    # Auto-ingest default company knowledge if empty
    try:
        from app.db.session import SessionLocal
        from app.db.models import KnowledgeDocument
        from app.services.knowledge_service import upload_knowledge_document
        
        db = SessionLocal()
        count = db.query(KnowledgeDocument).count()
        if count == 0:
            catalog_file = os.path.abspath("../data/company_catalog/product_catalog_2026.md")
            pricing_file = os.path.abspath("../data/pricing/approved_pricing_2026.csv")
            policy_file = os.path.abspath("../data/policies/commercial_delivery_terms.md")
            
            if os.path.exists(catalog_file):
                upload_knowledge_document(db, catalog_file, "product_catalog_2026.md", "catalog")
            if os.path.exists(pricing_file):
                upload_knowledge_document(db, pricing_file, "approved_pricing_2026.csv", "pricing")
            if os.path.exists(policy_file):
                upload_knowledge_document(db, policy_file, "commercial_delivery_terms.md", "policy")
            logger.info("Auto-seeded initial company knowledge base sources.")
        db.close()
    except Exception as e:
        logger.warning(f"Knowledge auto-seeding skipped: {e}")
        
    yield
    logger.info("QuoteGuard AI Backend Service Shutting Down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# 1. Request Tracking Middleware
app.add_middleware(RequestTrackingMiddleware)

# 2. Rate Limiting Middleware
app.add_middleware(RateLimiterMiddleware)

# 3. CSRF Protection Middleware
app.add_middleware(CSRFProtectionMiddleware)

# 4. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 5. Strict CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-Request-ID",
    ],
)

# Centralized Safe Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to QuoteGuard AI — Source-Grounded Agentic Quotation Platform",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
