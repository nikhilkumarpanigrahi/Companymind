<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20Vector%20Search-00ED64?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Groq-Llama_3_70B-F55036?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" />
</p>

# CompanyMind

**AI-Powered Enterprise Knowledge Base with Semantic Search & Retrieval-Augmented Generation**

> _"Stop searching for keywords. Start finding answers."_

CompanyMind transforms company documents into an intelligent, searchable knowledge base that understands *meaning* — not just words. It uses MongoDB Atlas Vector Search to find semantically relevant documents and Groq's Llama 3 70B to generate comprehensive, cited answers in real-time.

---

## The Problem

Traditional enterprise search fails:

- **Keyword mismatch** — Searching "how to speed up database queries" misses a document titled "Database Indexing Strategies" because the exact words don't match
- **Information silos** — Knowledge is scattered across documents that employees can't connect
- **No synthesis** — Even when documents are found, users must read and synthesize answers manually

Organizations lose **20% of productive time** searching for information they already have ([McKinsey](https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights)).

## Our Solution

CompanyMind converts every document into a **384-dimensional vector embedding** that captures semantic meaning. When you search, your query is embedded into the same vector space and MongoDB Atlas finds the most similar documents using **cosine similarity** — understanding intent, not just matching strings.

The **RAG pipeline** goes further: it retrieves the top matching documents and feeds them to **Llama 3 70B** which generates a comprehensive, cited answer — streamed in real-time via **Server-Sent Events**.

### Two Modes of Interaction

| Mode | How It Works | Latency |
|:-----|:-------------|:--------|
| **Semantic Search** | Query → 384-dim embedding → MongoDB `$vectorSearch` → ranked results with cosine relevance scores | < 200ms |
| **Ask AI (RAG)** | Query → retrieve top 5 docs → assemble context → Llama 3 70B generates cited answer → SSE token stream | 1–3s |

---

## Key Features

### Intelligent Search
- **Hybrid search** with Reciprocal Rank Fusion (RRF) — merges vector similarity + BM25 keyword relevance for best-of-both-worlds ranking
- **Pure vector search** — MongoDB `$vectorSearch` with HNSW indexing and cosine similarity
- **Full-text search** — MongoDB `$text` with stemming and stop-word removal
- **Regex fallback** — case-insensitive pattern matching as baseline

### AI-Powered Answers (RAG)
- **Real-time streaming** — tokens streamed via SSE with blinking cursor UI
- **Source citations** — every claim backed by `[Source: document title]` references
- **Multi-turn conversations** — sliding window memory (last 3 Q&A pairs) for contextual follow-ups
- **Context-grounded** — LLM instructed to use *only* retrieved documents, preventing hallucination

### Performance Engineering
- **Triple-layer caching** — Python embedding LRU (2,000 entries) → Node embedding LRU (500 entries, 10-min TTL) → search result LRU (200 entries, 5-min TTL)
- **Connection pooling** — MongoDB pool with 5–30 connections, zlib-compressed traffic
- **Over-fetch + re-rank** — fetches 5× results, applies RRF threshold filtering
- **Proportional numCandidates** — HNSW candidate set capped at 1,000 for optimal recall/speed

### Developer Experience
- **Benchmark suite** — runs identical query through 4 search strategies, compares latency, scores, and result overlap matrix
- **Voice search** — Web Speech API integration with auto-trigger in Ask mode
- **Pipeline animation** — visual step-by-step flow showing query processing in real-time
- **Zod validation** — every endpoint validated with strict schemas
- **One-command deployment** — Docker Compose, Render, or AWS ECS Fargate

---

## Architecture

```
                                    ┌─────────────────────────────┐
                                    │       MongoDB Atlas         │
                                    │  ┌──────────────────────┐  │
                                    │  │  $vectorSearch (HNSW) │  │
                                    │  │  384-dim cosine       │  │
                                    │  │  $text (BM25)         │  │
                                    │  └──────────────────────┘  │
                                    └────────────▲───────────────┘
                                                 │
┌──────────────┐    HTTP     ┌───────────────────┴──────────────┐     HTTP
│              │ ──────────▶ │        Express.js API            │ ──────────▶ ┌───────────────┐
│  React SPA   │             │        (Port 8080)               │              │  Groq API     │
│  Vite + TS   │ ◀────────── │                                  │ ◀────────── │  Llama 3 70B  │
│  Tailwind    │    JSON/SSE │  ┌─────────┐  ┌──────────────┐  │    JSON     └───────────────┘
│              │             │  │  3-Layer │  │  RRF Hybrid  │  │
└──────────────┘             │  │  Cache   │  │  Search      │  │     HTTP
                             │  └─────────┘  └──────────────┘  │ ──────────▶ ┌───────────────┐
                             └──────────────────────────────────┘              │  FastAPI       │
                                                                              │  MiniLM-L6-v2  │
                                                                              │  (Port 8000)   │
                                                                              └───────────────┘
```

> Full architecture documentation: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 3 | SPA with dark theme, SSE streaming, voice input |
| **Backend** | Express.js 4, Zod, Helmet, compression | REST API with validation, security headers, rate limiting |
| **Database** | MongoDB Atlas | `$vectorSearch` (HNSW), `$text` (BM25), aggregation pipelines |
| **Embeddings** | FastAPI, SentenceTransformers (`all-MiniLM-L6-v2`) | 384-dim L2-normalized vectors, batch + single embed |
| **LLM** | Groq API, Llama 3.3 70B Versatile | RAG answer generation with SSE streaming |
| **Deployment** | Docker, Docker Compose, Render, AWS ECS Fargate | Multi-stage builds, health checks, non-root containers |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB Atlas** account (free M0 tier works) — [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Groq API key** (free) — [Get key](https://console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/nikhilkumarpanigrahi/Companymind.git
cd Companymind
npm install

cd embedding-service
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/companymind?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_key_here
EMBEDDING_API_URL=http://localhost:8000/embed-query
VITE_API_BASE_URL=http://localhost:8080
PORT=8080
VECTOR_INDEX_NAME=documents_embedding_index
```

### 3. Create Vector Search Index in Atlas

1. Go to your Atlas cluster → **Atlas Search** → **Create Search Index**
2. Select **JSON Editor**, choose the `companymind.documents` collection
3. Set index name: `documents_embedding_index`
4. Paste:

```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 384,
    "similarity": "cosine"
  }]
}
```

5. Wait for status **Active** (~1 minute)

### 4. Start Services

```bash
# Terminal 1 — Embedding Service
cd embedding-service
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Backend API
npm run dev:server

# Terminal 3 — Frontend
npm run dev
```

### 5. Seed the Database

```bash
npm run db:seed          # Seeds 173 curated tech documents
```

### 6. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) and try:

| Query | What it finds |
|:------|:-------------|
| "how do vector databases work" | Vector DB, HNSW, similarity search docs |
| "speed up my application" | Caching, indexing, optimization — no keyword match needed |
| "protecting web apps from hackers" | XSS/CSRF, OWASP, DevSecOps — semantic understanding |
| "how transformers work in AI" | Attention mechanisms, BERT, transformer architecture |

> Detailed step-by-step setup: [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## How RAG Works — Step by Step

```
User Question                    "How does vector search find relevant documents?"
       │
       ▼
┌─────────────────┐
│  1. EMBED QUERY │              MiniLM-L6-v2 → 384-dim vector
└────────┬────────┘              (cached: 3 layers, ~0ms if hit)
         │
         ▼
┌─────────────────┐
│  2. VECTOR       │              MongoDB $vectorSearch (HNSW index)
│     SEARCH       │              cosine similarity, top-K results
└────────┬────────┘              (~20-80ms)
         │
         ▼
┌─────────────────┐
│  3. CONTEXT      │              Top 5 docs assembled with titles,
│     ASSEMBLY     │              relevance scores, truncated content
└────────┬────────┘              + last 3 conversation turns
         │
         ▼
┌─────────────────┐
│  4. LLM STREAM  │              Groq Llama 3 70B generates answer
│     (SSE)        │              using ONLY retrieved context
└────────┬────────┘              Tokens streamed in real-time
         │
         ▼
   Cited Answer                  Includes [Source: title] citations
   + Source List                 Users can verify every claim
```

> Full RAG pipeline details: [ARCHITECTURE.md](ARCHITECTURE.md#rag-pipeline)

---

## Hybrid Search Algorithm

CompanyMind uses **Reciprocal Rank Fusion (RRF)** to combine vector and keyword search — a parameter-free ranking method that outperforms linear score interpolation:

```
                    Vector Search                    Text Search
                    (semantic meaning)               (keyword relevance)
                          │                                │
                    rank by cosine                   rank by BM25
                    similarity                       textScore
                          │                                │
                          └──────────┬─────────────────────┘
                                     │
                              ┌──────▼──────┐
                              │  RRF Merge  │
                              │             │
                              │  score(d) = │
                              │  Σ 1/(K+r+1)│
                              │  K = 60     │
                              └──────┬──────┘
                                     │
                              Threshold Filter
                              (removes noise)
                                     │
                              Final Ranked
                              Results
```

Documents appearing in **both** result lists get boosted scores. The K=60 constant follows the [original RRF paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf), providing robust ranking regardless of score distribution differences.

---

## Benchmark System

Run the same query through **4 search strategies** side-by-side:

| Strategy | Method | What It Tests |
|:---------|:-------|:-------------|
| Regex | `$regex` case-insensitive | Baseline — brute-force pattern matching |
| Full-Text | `$text` + textScore | Traditional keyword search with stemming |
| Vector | `$vectorSearch` cosine | Pure semantic similarity |
| Hybrid | Vector + Text + RRF | Best-of-both-worlds fusion |

The benchmark reports:
- **Per-method latency** (ms) with visual bar chart
- **Result count** and **average relevance score**
- **Overlap matrix** — percentage of shared results between each pair of methods
- **Expandable result cards** — inspect individual documents per method

---

## Project Structure

```
CompanyMind/
├── src/                          # React frontend
│   ├── pages/                    # 6 pages: Dashboard, Search, Documents, Benchmarks, HowItWorks, Admin
│   ├── components/               # SearchBar, ResultCard, AIAnswer, SearchPipelineAnimation, etc.
│   ├── api/                      # Typed API client (axios)
│   └── hooks/                    # useDebounce (450ms), useSpeechToText (Web Speech API)
│
├── controllers/                  # Express route handlers
│   ├── documentController.cjs    # CRUD + stats + search orchestration
│   ├── ragController.cjs         # RAG + SSE streaming + analytics
│   └── benchmarkController.cjs   # Multi-method benchmark runner
│
├── services/                     # Core business logic
│   ├── documentService.cjs       # Vector, text, regex, hybrid RRF search + caching
│   ├── embeddingService.cjs      # Embedding generation with LRU cache
│   └── ragService.cjs            # LLM context assembly + Groq API + streaming
│
├── models/                       # Mongoose schemas
│   └── Document.cjs              # title, content, category, tags, embedding[384]
│
├── routes/                       # Express route definitions
├── middleware/                    # Validation, error handling, rate limiting, logging
├── validators/                   # Zod schemas for all endpoints
├── config/                       # DB connection pooling + env config
│
├── embedding-service/            # Python FastAPI microservice
│   └── app/
│       ├── main.py               # FastAPI app with CORS, health, embed endpoints
│       ├── embedding.py          # SentenceTransformer engine + LRU cache
│       ├── models.py             # Pydantic request/response models
│       └── config.py             # Model configuration
│
├── scripts/                      # Data pipeline utilities
├── seeds/                        # Sample data + seeder (173 documents)
├── aws/                          # AWS ECS Fargate deployment scripts
├── Dockerfile                    # Multi-stage production build
├── docker-compose.prod.yml       # Production Docker Compose
└── render.yaml                   # Render.com Blueprint IaC
```

> Full API reference: [API_REFERENCE.md](API_REFERENCE.md)

---

## Deployment

### Docker Compose (Recommended)

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Both services use **multi-stage Docker builds**:
- ML model baked into the image (zero cold-start download)
- CPU-only PyTorch (~3 GB smaller image)
- Non-root `appuser` in both containers
- Health checks with 30-second intervals

### Render

One-click deploy via [render.yaml](render.yaml) Blueprint — auto-wires service URLs between containers.

### AWS ECS Fargate

```powershell
./aws/deploy.ps1    # Creates ECR repos, ECS cluster, task definitions
```

---

## Performance

| Metric | Value | Details |
|:-------|:------|:--------|
| Embedding generation | ~50ms | MiniLM-L6-v2, 384 dimensions |
| Vector search | 20–80ms | MongoDB `$vectorSearch` HNSW |
| Hybrid search (end-to-end) | < 200ms | Including embedding + RRF merge |
| RAG answer | 1–3s | Groq Llama 3 70B, 1024 max tokens |
| Cache hit (embedding) | < 1ms | 3-tier LRU cache |
| Cache hit (search) | < 1ms | 200-entry result cache, 5-min TTL |

---

## Security

- **Helmet** — security headers (strict transport, X-Frame-Options, etc.)
- **Rate limiting** — 100 req/min general, 30 req/min for search/ask endpoints
- **Zod validation** — strict input validation on all endpoints
- **Non-root Docker** — both containers run as unprivileged `appuser`
- **1 MB body limit** — prevents large payload attacks
- **MongoDB zlib compression** — encrypted + compressed traffic
- **CORS** — configurable origin policy

> Full security details: [SECURITY.md](SECURITY.md)

---

## Example Queries

### Semantic Search (meaning-based)

| Query | Why it works |
|:------|:-------------|
| "speed up my app" | Finds caching, indexing, optimization docs — no keyword overlap |
| "protecting against cyber threats" | Returns XSS, CSRF, OWASP docs — semantic understanding |
| "how machines learn from data" | Matches ML, deep learning, neural network documents |

### Ask AI (RAG with citations)

> **Q:** "How does vector search differ from traditional search?"
>
> **A:** Vector search fundamentally differs from traditional search in how it represents and matches information. Traditional search relies on exact keyword matching using inverted indexes, where documents are found only if they contain the exact query terms. Vector search, by contrast, converts both documents and queries into dense numerical representations (embeddings) that capture semantic meaning...
>
> [Source: Vector Databases Explained] [Source: MongoDB Atlas Vector Search] [Source: Semantic Search Architecture]

---

## Scripts & Utilities

| Command | Description |
|:--------|:-----------|
| `npm run dev` | Start Vite frontend dev server |
| `npm run dev:server` | Start Express backend with nodemon |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run db:seed` | Seed 173 curated tech documents |
| `npm run db:seed:large` | Seed from large dataset JSON |
| `npm run generate:dataset` | Generate 2,000 template-based documents |
| `npm run load:documents` | Bulk load from JSONL file |

---

## What Makes CompanyMind Different

1. **Hybrid RRF search** — not just vector OR keyword, but a mathematically proven fusion that captures both semantic meaning and exact term relevance
2. **Triple-layer caching** — three independent LRU caches minimize latency from embedding generation to final results
3. **Production-ready SSE streaming** — Nginx-aware headers, graceful error events, never drops the connection
4. **Multi-turn RAG conversations** — sliding window context enables natural follow-up questions
5. **Built-in benchmark suite** — quantitatively prove vector search outperforms traditional methods with overlap analysis
6. **Zero-download Docker** — ML model baked into the image via multi-stage build
7. **Voice search** — Web Speech API integration for hands-free knowledge retrieval
8. **Resilient architecture** — server starts before DB connects, health checks always respond, graceful shutdown with connection draining

---

## License

[Apache License 2.0](LICENSE) — free for commercial and non-commercial use.

---

## Documentation

| Document | Description |
|:---------|:-----------|
| [README.md](README.md) | Project overview, quick start, and features |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Detailed system architecture, data flows, and design decisions |
| [API_REFERENCE.md](API_REFERENCE.md) | Complete API documentation with request/response schemas |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Step-by-step setup instructions with troubleshooting |
| [SECURITY.md](SECURITY.md) | Security model and threat mitigation |

---

<p align="center">
  <strong>Built for the MongoDB AI Hackathon</strong><br/>
  <em>Turning documents into knowledge, and knowledge into answers.</em>
</p>
