"""Application settings loaded from environment variables."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central settings object for Dion backend."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dion.db")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200")
    )
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/v1")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")


settings = Settings()
