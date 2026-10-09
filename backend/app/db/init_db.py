from app.db.session import engine, Base, SessionLocal
from app.db.models import Company, User, KnowledgeDocument, DocumentChunk
from app.core.logging import logger
from app.core.config import settings
from app.core.security import hash_password
import os
from sqlalchemy import text


def _ensure_user_auth_columns():
    """Lightweight SQLite migration: add auth and security columns to existing tables."""
    with engine.connect() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if cols:
            if "hashed_password" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR"))
            if "is_active" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            if "login_otp" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN login_otp VARCHAR"))
            if "login_otp_expires_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN login_otp_expires_at DATETIME"))
            if "login_otp_created_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN login_otp_created_at DATETIME"))
            if "login_attempts" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0"))
            if "failed_login_attempts" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"))
            if "locked_until" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))

        pending_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(pending_users)"))}
        if pending_cols:
            if "last_otp_sent_at" not in pending_cols:
                conn.execute(text("ALTER TABLE pending_users ADD COLUMN last_otp_sent_at DATETIME"))

        conn.commit()


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_user_auth_columns()
    db = SessionLocal()
    try:
        # Create default company if not exists
        company = db.query(Company).first()
        if not company:
            company = Company(
                id="comp_vertex_001",
                name="Vertex Industrial Supplies Pvt. Ltd."
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            logger.info("Initialized default company: Vertex Industrial Supplies Pvt. Ltd.")

        # Create default admin user
        admin = db.query(User).filter(User.email == "sales.manager@vertexind.com").first()
        if not admin:
            admin = User(
                id="user_admin_001",
                company_id=company.id,
                email="sales.manager@vertexind.com",
                name="Rajesh Verma",
                role="sales_manager",
                hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Initialized default sales manager user.")
        elif not admin.hashed_password:
            # Backfill a password for legacy rows created before auth existed
            admin.hashed_password = hash_password(settings.DEFAULT_ADMIN_PASSWORD)
            admin.is_active = True
            db.commit()
            logger.info("Backfilled password for existing default user.")

    except Exception as e:
        logger.error(f"Error initializing DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
