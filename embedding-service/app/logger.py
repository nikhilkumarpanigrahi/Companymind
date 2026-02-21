"""
Centralized logging configuration.
"""

import logging
import sys

from app.config import get_settings


def setup_logging() -> logging.Logger:
    """Configure and return the root application logger."""
    settings = get_settings()

    logger = logging.getLogger("embedding_service")
    logger.setLevel(settings.LOG_LEVEL.upper())

    # Avoid adding duplicate handlers on reload
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(settings.LOG_LEVEL.upper())
        formatter = logging.Formatter(settings.LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()
