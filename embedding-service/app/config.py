"""
Application configuration using Pydantic Settings.
All values can be overridden via environment variables or a .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "Embedding Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Server ───────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1  # uvicorn workers; keep 1 when GPU‑bound

    # ── Model ────────────────────────────────────────────────────────────
    MODEL_NAME: str = "all-MiniLM-L6-v2"
    # Device: "cpu", "cuda", or "auto" (auto picks GPU if available)
    DEVICE: str = "cpu"
    # Maximum tokens the model will process per text (truncation)
    MAX_SEQ_LENGTH: int = 256

    # ── Batch ────────────────────────────────────────────────────────────
    MAX_BATCH_SIZE: int = 512  # upper‑bound texts per /embed-batch call
    NORMALIZE_EMBEDDINGS: bool = True  # L2 normalize output vectors

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["*"]

    # ── Logging ──────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()
