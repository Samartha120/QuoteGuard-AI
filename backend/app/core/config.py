from pydantic import ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuoteGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Demo Mode
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    GROUNDING_THRESHOLD: float = 0.80
    
    # LLM Settings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./app/db/quoteguard.db"

    # Auth / JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_quoteguard_dev_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h
    DEFAULT_ADMIN_PASSWORD: str = "quoteguard123"
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma_db"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def DATA_DIR(self) -> str:
        """Absolute path to the repo-root /data directory, resolved from this file's
        location so it works regardless of the process working directory."""
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

    @property
    def RFQ_SAMPLES_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "rfqs")

    @property
    def EVAL_DATASET_PATH(self) -> str:
        return os.path.join(self.DATA_DIR, "evaluation", "test_dataset.json")

    @property
    def PRICING_CSV_PATH(self) -> str:
        return os.path.join(self.DATA_DIR, "pricing", "approved_pricing_2026.csv")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
