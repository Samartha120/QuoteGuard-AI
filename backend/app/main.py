from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.logging import logger
from app.db.init_db import init_db
from app.api.router import api_router

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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Protection against XSS and clickjacking
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # HSTS for production
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
    # Content Security Policy (strict API profile)
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';"
    
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to QuoteGuard AI — Source-Grounded Agentic Quotation Platform",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
