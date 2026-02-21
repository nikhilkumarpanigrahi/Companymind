# ──────────────────────────────────────────────────────────────
#  Embedding Service  |  Multi‑stage Docker build
# ──────────────────────────────────────────────────────────────
#  Stage 1 – download & cache the model (large layer, cached)
#  Stage 2 – slim runtime image
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Model Downloader ────────────────────────────────
FROM python:3.11-slim AS model-downloader

RUN pip install --no-cache-dir sentence-transformers==3.3.1

# Pre‑download the model so it's baked into the image
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('all-MiniLM-L6-v2')"

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="CompanyMind AI Team"
LABEL description="FastAPI embedding microservice for semantic search"

# System deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /service

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy cached model from stage 1
COPY --from=model-downloader /root/.cache/huggingface /root/.cache/huggingface

# Copy app source
COPY app/ app/

# Non‑root user for security
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /service
USER appuser

# Expose service port
EXPOSE 8000

# Health check (Docker native)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
