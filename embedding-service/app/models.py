"""
Pydantic models for request / response validation.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Request Models ───────────────────────────────────────────────────────────

class EmbedQueryRequest(BaseModel):
    """Single text to embed (typically a user search query)."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="The text string to generate an embedding for.",
        json_schema_extra={"examples": ["What is semantic search?"]},
    )


class EmbedBatchRequest(BaseModel):
    """Batch of texts to embed (typically documents being ingested)."""
    texts: List[str] = Field(
        ...,
        min_length=1,
        description="A list of text strings to generate embeddings for.",
        json_schema_extra={
            "examples": [
                [
                    "MongoDB is a document database.",
                    "Semantic search uses vector embeddings.",
                ]
            ]
        },
    )


# ── Response Models ──────────────────────────────────────────────────────────

class EmbedQueryResponse(BaseModel):
    """Response for a single‑query embedding."""
    embedding: List[float] = Field(
        ..., description="L2‑normalized embedding vector."
    )
    dimension: int = Field(
        ..., description="Dimensionality of the embedding."
    )
    model: str = Field(
        ..., description="Name of the model used."
    )


class EmbedBatchResponse(BaseModel):
    """Response for a batch embedding request."""
    embeddings: List[List[float]] = Field(
        ..., description="List of L2‑normalized embedding vectors."
    )
    dimension: int = Field(
        ..., description="Dimensionality of each embedding."
    )
    count: int = Field(
        ..., description="Number of embeddings returned."
    )
    model: str = Field(
        ..., description="Name of the model used."
    )


class HealthResponse(BaseModel):
    """Health‑check response."""
    status: str = "ok"
    model_loaded: bool
    model_name: str
    embedding_dimension: int
    version: str
    cache_stats: Optional[Dict[str, Any]] = None
