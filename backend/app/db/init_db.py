from app.db.session import engine, Base, SessionLocal
from app.db.models import Company, User, KnowledgeDocument, DocumentChunk
from app.core.logging import logger
import os

def init_db():
    Base.metadata.create_all(bind=engine)
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
            user = User(
                id="user_admin_001",
                company_id=company.id,
                email="sales.manager@vertexind.com",
                name="Rajesh Verma",
                role="sales_manager"
            )
            db.add(user)
            db.commit()
            logger.info("Initialized default sales manager user.")

    except Exception as e:
        logger.error(f"Error initializing DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
