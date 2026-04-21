from pydantic_settings import BaseSettings
import secrets

class Settings(BaseSettings):
    # SECRET_KEY must be set in .env for production.
    # Fallback is generated per-process for local dev only.
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    DATABASE_URL: str = "sqlite:///./study_planner.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

settings = Settings()
