"""
Core embedding engine.

Loads the SentenceTransformer model ONCE at startup and exposes
efficient methods for single and batch embedding generation.
"""

from __future__ import annotations

import time
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import Settings, get_settings
from app.logger import logger


class EmbeddingEngine:
    """Wraps SentenceTransformer with production helpers."""

    _instance: Optional["EmbeddingEngine"] = None

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._model: SentenceTransformer | None = None
        self._dimension: int = 0

    # ── Singleton accessor ───────────────────────────────────────────────
    @classmethod
    def get_instance(cls) -> "EmbeddingEngine":
        """Return the singleton engine (created on first call)."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── Lifecycle ────────────────────────────────────────────────────────
    def load_model(self) -> None:
        """Download (if needed) and load the model into memory."""
        start = time.perf_counter()
        logger.info(
            "Loading model '%s' on device '%s' …",
            self.settings.MODEL_NAME,
            self.settings.DEVICE,
        )

        self._model = SentenceTransformer(
            self.settings.MODEL_NAME,
            device=self.settings.DEVICE,
        )
        self._model.max_seq_length = self.settings.MAX_SEQ_LENGTH

        # Probe dimension with a dummy encode
        dummy = self._model.encode(["hello"], normalize_embeddings=True)
        self._dimension = dummy.shape[1]

        elapsed = time.perf_counter() - start
        logger.info(
            "Model loaded in %.2fs  |  dimension=%d  |  max_seq_length=%d",
            elapsed,
            self._dimension,
            self._model.max_seq_length,
        )

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def dimension(self) -> int:
        return self._dimension

    # ── Encoding ─────────────────────────────────────────────────────────
    def encode_single(self, text: str) -> list[float]:
        """Encode a single text and return L2‑normalized vector."""
        assert self._model is not None, "Model not loaded"
        embedding: np.ndarray = self._model.encode(
            [text],
            normalize_embeddings=self.settings.NORMALIZE_EMBEDDINGS,
            show_progress_bar=False,
        )
        return embedding[0].tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Encode a batch of texts.

        SentenceTransformer internally handles batching to the GPU/CPU,
        so we pass the full list for maximum throughput.
        """
        assert self._model is not None, "Model not loaded"

        if len(texts) > self.settings.MAX_BATCH_SIZE:
            raise ValueError(
                f"Batch size {len(texts)} exceeds limit of "
                f"{self.settings.MAX_BATCH_SIZE}."
            )

        start = time.perf_counter()
        embeddings: np.ndarray = self._model.encode(
            texts,
            normalize_embeddings=self.settings.NORMALIZE_EMBEDDINGS,
            batch_size=64,  # internal mini‑batch for memory efficiency
            show_progress_bar=False,
        )
        elapsed = time.perf_counter() - start

        logger.info(
            "Encoded %d texts in %.3fs (%.1f texts/s)",
            len(texts),
            elapsed,
            len(texts) / elapsed if elapsed > 0 else 0,
        )
        return embeddings.tolist()
