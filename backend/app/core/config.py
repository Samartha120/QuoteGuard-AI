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
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma_db"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
