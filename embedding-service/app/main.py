"""
FastAPI application entry‑point.

Endpoints:
    GET  /health        – readiness probe
    POST /embed-query   – embed a single search query
    POST /embed-batch   – embed a batch of documents
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.config import get_settings
from app.embedding import EmbeddingEngine
from app.logger import logger
from app.models import (
    EmbedBatchRequest,
    EmbedBatchResponse,
    EmbedQueryRequest,
    EmbedQueryResponse,
    HealthResponse,
)

settings = get_settings()


# ── Lifespan: load model once at startup ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embedding model before the server starts accepting traffic."""
    engine = EmbeddingEngine.get_instance()
    engine.load_model()
    logger.info("🚀  %s v%s is ready", settings.APP_NAME, settings.APP_VERSION)
    yield
    logger.info("Shutting down …")


# ── App factory ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production‑ready embedding microservice for the CompanyMind "
        "Semantic Search Engine.  Generates L2‑normalized vector embeddings "
        "using SentenceTransformers."
    ),
    lifespan=lifespan,
    default_response_class=ORJSONResponse,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Logging middleware ───────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d  (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ── Health check ─────────────────────────────────────────────────────────────
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Readiness / health check",
)
async def health():
    engine = EmbeddingEngine.get_instance()
    return HealthResponse(
        status="ok" if engine.is_loaded else "unavailable",
        model_loaded=engine.is_loaded,
        model_name=settings.MODEL_NAME,
        embedding_dimension=engine.dimension,
        version=settings.APP_VERSION,
        cache_stats=engine.cache_stats if engine.is_loaded else None,
    )


# ── Single query embedding ───────────────────────────────────────────────────
@app.post(
    "/embed-query",
    response_model=EmbedQueryResponse,
    tags=["Embeddings"],
    summary="Generate embedding for a single query",
)
async def embed_query(payload: EmbedQueryRequest):
    engine = EmbeddingEngine.get_instance()
    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    embedding = engine.encode_single(payload.text)
    return EmbedQueryResponse(
        embedding=embedding,
        dimension=engine.dimension,
        model=settings.MODEL_NAME,
    )


# ── Batch embedding ─────────────────────────────────────────────────────────
@app.post(
    "/embed-batch",
    response_model=EmbedBatchResponse,
    tags=["Embeddings"],
    summary="Generate embeddings for a batch of texts",
)
async def embed_batch(payload: EmbedBatchRequest):
    engine = EmbeddingEngine.get_instance()
    if not engine.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    if len(payload.texts) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Batch size {len(payload.texts)} exceeds the maximum "
                f"allowed ({settings.MAX_BATCH_SIZE})."
            ),
        )

    try:
        embeddings = engine.encode_batch(payload.texts)
    except Exception as exc:
        logger.exception("Batch encoding failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return EmbedBatchResponse(
        embeddings=embeddings,
        dimension=engine.dimension,
        count=len(embeddings),
        model=settings.MODEL_NAME,
    )
