# 🔍 Embedding Service — CompanyMind Semantic Search

Production-ready **FastAPI** microservice that generates **L2-normalized semantic embeddings** using [SentenceTransformers (`all-MiniLM-L6-v2`)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).

This service is the **AI / NLP component** of the CompanyMind Semantic Search Engine.  
The Node.js backend calls this service to convert documents and user queries into 384-dimensional vectors that are stored and searched in **MongoDB Atlas Vector Search**.

---

## Architecture

```
┌──────────┐   query   ┌────────────────┐  /embed-query  ┌────────────────────┐
│  React   │ ────────► │  Express API   │ ──────────────► │  Embedding Service │
│ Frontend │ ◄──────── │  (Node.js)     │ ◄────────────── │  (FastAPI/Python)  │
└──────────┘  results  └───────┬────────┘   embedding     └────────────────────┘
                               │                                    │
                               │  vector search                     │  model: all-MiniLM-L6-v2
                               ▼                                    │  dim: 384
                      ┌────────────────┐                            │
                      │  MongoDB Atlas │ ◄──────────────────────────┘
                      │  Vector Search │   /embed-batch (ingestion)
                      └────────────────┘
```

---

## Endpoints

| Method | Path            | Description                          |
| ------ | --------------- | ------------------------------------ |
| GET    | `/health`       | Readiness probe / health check       |
| POST   | `/embed-query`  | Embed a single search query          |
| POST   | `/embed-batch`  | Embed a batch of documents (≤ 512)   |
| GET    | `/docs`         | Interactive Swagger UI               |
| GET    | `/redoc`        | ReDoc documentation                  |

---

## Quick Start

### 1. Local development (without Docker)

```bash
cd embedding-service

# Create a virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Copy environment config
copy .env.example .env

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The model will be downloaded automatically on first run (~90 MB) and cached in `~/.cache/huggingface/`.

### 2. Docker

```bash
cd embedding-service

# Build the image (model is baked in via multi-stage build)
docker build -t companymind-embedding .

# Run
docker run -p 8000:8000 companymind-embedding
```

### 3. Docker Compose

```bash
cd embedding-service
docker-compose up -d
```

---

## Example `curl` Requests

### Health Check

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "all-MiniLM-L6-v2",
  "embedding_dimension": 384,
  "version": "1.0.0"
}
```

### Embed a Single Query

```bash
curl -X POST http://localhost:8000/embed-query \
  -H "Content-Type: application/json" \
  -d '{"text": "What is semantic search?"}'
```

```json
{
  "embedding": [0.0123, -0.0456, ...],   // 384 floats
  "dimension": 384,
  "model": "all-MiniLM-L6-v2"
}
```

### Embed a Batch of Documents

```bash
curl -X POST http://localhost:8000/embed-batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "MongoDB is a document database.",
      "Semantic search uses vector embeddings.",
      "Atlas Vector Search enables similarity queries."
    ]
  }'
```

```json
{
  "embeddings": [[0.012, ...], [0.034, ...], [0.056, ...]],
  "dimension": 384,
  "count": 3,
  "model": "all-MiniLM-L6-v2"
}
```

---

## Configuration (Environment Variables)

| Variable               | Default              | Description                                    |
| ---------------------- | -------------------- | ---------------------------------------------- |
| `MODEL_NAME`           | `all-MiniLM-L6-v2`  | HuggingFace SentenceTransformer model ID       |
| `DEVICE`               | `cpu`                | `cpu`, `cuda`, or `auto`                       |
| `MAX_SEQ_LENGTH`       | `256`                | Max tokens per text (truncation)               |
| `MAX_BATCH_SIZE`       | `512`                | Upper bound for `/embed-batch` request size    |
| `NORMALIZE_EMBEDDINGS` | `true`               | L2-normalize output vectors                    |
| `PORT`                 | `8000`               | Server port                                    |
| `WORKERS`              | `1`                  | Uvicorn workers (keep 1 for CPU/single-GPU)    |
| `LOG_LEVEL`            | `INFO`               | Python log level                               |
| `CORS_ORIGINS`         | `["*"]`              | Allowed origins                                |

---

## Performance Tips & Production Best Practices

### 1. Model Loading
- The model is loaded **once at startup** via the `lifespan` event — no per-request overhead.
- On subsequent starts the cached model files in `~/.cache/huggingface/` are reused (instant load).

### 2. Batching
- Always prefer `/embed-batch` over looping `/embed-query` — SentenceTransformers parallelizes batch encoding internally.
- The internal mini-batch size is 64; tune via the `batch_size` param in `embedding.py` for your hardware.

### 3. GPU Acceleration
- Set `DEVICE=cuda` and install `torch` with CUDA (e.g. `pip install torch --index-url https://download.pytorch.org/whl/cu121`).
- On GPU, throughput can reach **5,000+ texts/sec** compared to ~200/sec on CPU.

### 4. Concurrency
- Uvicorn runs an async event loop; however, `model.encode()` is CPU/GPU-bound and blocks.
- Keep `WORKERS=1` to avoid loading the model multiple times.
- For true concurrency, place an **nginx or Traefik** reverse-proxy in front and scale horizontally (multiple container replicas) behind a load balancer.

### 5. Memory
- `all-MiniLM-L6-v2` uses ~90 MB for model weights.
- Runtime memory depends on batch size. A batch of 512 texts needs ~200 MB total.
- The Docker Compose file limits memory to 1 GB which is generous for CPU workloads.

### 6. Normalization
- Embeddings are **L2-normalized** by default, which means cosine similarity = dot product.
- MongoDB Atlas Vector Search supports `dotProduct` similarity — use it for fastest retrieval.

### 7. Monitoring
- The `/health` endpoint returns model status and can be used as a **Kubernetes readiness probe** or Docker health check.
- Structured logging writes to stdout; aggregate with ELK, CloudWatch, or any log collector.

---

## Integration with Express Backend

Your **Node.js Express** backend should call this service when:

1. **Ingesting documents** → `POST /embed-batch` with the document contents, then store the returned vectors alongside documents in MongoDB.
2. **Handling search queries** → `POST /embed-query` with the user's query text, then run an Atlas Vector Search `$vectorSearch` aggregation with the returned vector.

Example Node.js call (using `axios`):

```javascript
const axios = require('axios');

const EMBEDDING_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

// Embed a user query
async function embedQuery(text) {
  const { data } = await axios.post(`${EMBEDDING_URL}/embed-query`, { text });
  return data.embedding; // float[384]
}

// Embed documents in batch
async function embedDocuments(texts) {
  const { data } = await axios.post(`${EMBEDDING_URL}/embed-batch`, { texts });
  return data.embeddings; // float[N][384]
}
```

---

## Project Structure

```
embedding-service/
├── app/
│   ├── __init__.py       # Package marker
│   ├── config.py         # Pydantic Settings (env-driven config)
│   ├── embedding.py      # EmbeddingEngine (model load + encode)
│   ├── logger.py         # Centralized logging
│   ├── main.py           # FastAPI app, routes & middleware
│   └── models.py         # Pydantic request / response schemas
├── .env.example          # Reference environment variables
├── docker-compose.yml    # One-command deployment
├── Dockerfile            # Multi-stage build (model baked in)
├── README.md             # ← You are here
└── requirements.txt      # Pinned Python dependencies
```

---

## License

See the root [LICENSE](../LICENSE) file.
