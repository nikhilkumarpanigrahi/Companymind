# Architecture

> Deep dive into CompanyMind's system design, data flows, and technical decisions.

---

## System Overview

CompanyMind is a **3-service microservice architecture** that separates concerns between user interface, business logic, and machine learning inference:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React 18 SPA (TypeScript + Vite 6 + Tailwind CSS 3)     │  │
│  │                                                           │  │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐ │  │
│  │  │ Search  │  │ Ask AI   │  │ Dashboard │  │ Benchmark│ │  │
│  │  │ Page    │  │ (SSE)    │  │ Analytics │  │ Suite    │ │  │
│  │  └─────────┘  └──────────┘  └───────────┘  └──────────┘ │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │ HTTP / SSE                            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     API TIER (Port 8080)                        │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  Express.js 4 (CommonJS)                                  │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Middleware Stack                                     │ │  │
│  │  │  Helmet → CORS → Compression → Rate Limit → Logger  │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ Document │  │ Search   │  │ Ask/RAG  │  │Benchmark │ │  │
│  │  │ Routes   │  │ Routes   │  │ Routes   │  │ Routes   │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       │              │              │              │       │  │
│  │  ┌────▼──────────────▼──────────────▼──────────────▼────┐ │  │
│  │  │  Service Layer                                       │ │  │
│  │  │                                                      │ │  │
│  │  │  ┌────────────────┐  ┌──────────────┐  ┌──────────┐ │ │  │
│  │  │  │ documentService│  │embeddingServ.│  │ragService│ │ │  │
│  │  │  │  • vector      │  │  • embed()   │  │ • ask()  │ │ │  │
│  │  │  │  • text        │  │  • LRU cache │  │ • stream │ │ │  │
│  │  │  │  • regex       │  │  500 entries │  │ • memory │ │ │  │
│  │  │  │  • hybrid RRF  │  └──────┬───────┘  └────┬─────┘ │ │  │
│  │  │  │  • result cache│         │               │       │ │  │
│  │  │  └────────┬───────┘         │               │       │ │  │
│  │  └───────────┼─────────────────┼───────────────┼───────┘ │  │
│  └──────────────┼─────────────────┼───────────────┼─────────┘  │
│                 │                 │               │             │
└─────────────────┼─────────────────┼───────────────┼─────────────┘
                  │                 │               │
    ┌─────────────▼─────┐  ┌───────▼───────┐  ┌───▼──────────────┐
    │  MongoDB Atlas     │  │ FastAPI        │  │  Groq API        │
    │                    │  │ (Port 8000)    │  │                  │
    │  • $vectorSearch   │  │                │  │  Llama 3.3 70B   │
    │    HNSW, cosine    │  │  MiniLM-L6-v2  │  │  Versatile       │
    │    384 dimensions  │  │  384-dim output │  │                  │
    │  • $text (BM25)    │  │  L2-normalized  │  │  Temperature 0.3 │
    │  • aggregation     │  │  LRU cache     │  │  Max 1024 tokens │
    │    pipeline        │  │  2000 entries   │  │  SSE streaming   │
    └────────────────────┘  └────────────────┘  └──────────────────┘
```

---

## Data Flow: Semantic Search

```
 User types: "speed up my application"
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │ 1. FRONTEND (React)                  │
 │    • useDebounce (450ms) waits for   │
 │      user to stop typing             │
 │    • Sends GET /api/search?q=...     │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 2. VALIDATION (Zod middleware)       │
 │    • Validates query (1-1000 chars)  │
 │    • Parses page, pageSize           │
 │    • Returns 400 on invalid input    │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 3. CACHE CHECK (LRU)                │
 │    Key: "hybrid:<query>:<limit>"     │
 │    Hit? → Return cached results      │
 │    Miss? → Continue to step 4        │
 └─────────────────┬────────────────────┘
                   │ cache miss
                   ▼
 ┌──────────────────────────────────────┐
 │ 4. EMBEDDING (Node LRU → Python)    │
 │    • Check Node-side LRU (500 max)   │
 │    • If miss: HTTP POST to FastAPI   │
 │    • Python checks its LRU (2000)    │
 │    • If miss: run MiniLM-L6-v2       │
 │    • Returns 384-dim float vector    │
 │    • Caches at both Node + Python    │
 └─────────────────┬────────────────────┘
                   │ [0.032, -0.108, ...]
                   ▼
 ┌──────────────────────────────────────┐
 │ 5. PARALLEL SEARCH (Promise.all)     │
 │                                      │
 │  ┌────────────────┐ ┌──────────────┐ │
 │  │ $vectorSearch   │ │ $text search │ │
 │  │ numCandidates:  │ │ BM25 scoring │ │
 │  │ min(overF*10,   │ │ textScore    │ │
 │  │   200, 1000)    │ │ Graceful     │ │
 │  │ limit: overF    │ │ fallback     │ │
 │  └───────┬────────┘ └──────┬───────┘ │
 │          │                  │         │
 │          └────────┬─────────┘         │
 │                   │                   │
 │           ┌───────▼──────┐            │
 │           │  RRF MERGE   │            │
 │           │  K = 60      │            │
 │           │  score(d) =  │            │
 │           │  Σ 1/(K+r+1) │            │
 │           └───────┬──────┘            │
 │                   │                   │
 │           Threshold Filter            │
 │           Cache result                │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 6. RESPONSE                          │
 │    { results, totalResults, page,    │
 │      pageSize, totalPages, tookMs }  │
 │    Each result: title, content,      │
 │    category, tags, relevanceScore    │
 │    (cosine similarity percentage)    │
 └──────────────────────────────────────┘
```

---

## Data Flow: RAG (Ask AI)

```
 User asks: "How does vector search find relevant documents?"
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │ 1. FRONTEND                          │
 │    • POST /api/ask/stream            │
 │    • Body: { question,               │
 │        conversationHistory }         │
 │    • Opens SSE EventSource           │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 2. EMBED + SEARCH                    │
 │    • Generate query embedding        │
 │    • vectorSearch → top 5 documents  │
 │    • Preserve cosine similarity      │
 │      score as vectorScore            │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 3. CONTEXT ASSEMBLY                  │
 │                                      │
 │  System Prompt:                      │
 │  "You are CompanyMind AI — an        │
 │   intelligent knowledge assistant    │
 │   for enterprise teams..."           │
 │                                      │
 │  Context (per source):               │
 │  --- Source 1: "Title" (rel: 85%) ---│
 │  <content truncated to 1500 chars>   │
 │  --- Source 2: ...                   │
 │                                      │
 │  Conversation History:               │
 │  Last 3 Q&A pairs (6 messages)       │
 │  Each truncated to 500 chars         │
 │                                      │
 │  USER QUESTION: <question>           │
 └─────────────────┬────────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────────┐
 │ 4. LLM STREAMING (Groq API)         │
 │                                      │
 │  Model: llama-3.3-70b-versatile      │
 │  Temperature: 0.3                    │
 │  Max tokens: 1024                    │
 │  Top_p: 0.9                          │
 │  Timeout: 30s                        │
 │                                      │
 │  SSE Events:                         │
 │  → { type: 'sources', sources }      │
 │  → { type: 'token', content }  ×N    │
 │  → { type: 'done', meta, fullAnswer }│
 │  → { type: 'error', error }  (fail)  │
 └─────────────────┬────────────────────┘
                   │ SSE stream
                   ▼
 ┌──────────────────────────────────────┐
 │ 5. FRONTEND RENDERING                │
 │    • Sources displayed immediately   │
 │    • Tokens appended with blinking   │
 │      cursor as they arrive           │
 │    • Markdown formatting applied     │
 │    • Copy-to-clipboard on complete   │
 │    • Query logged to analytics       │
 └──────────────────────────────────────┘
```

---

## RAG Pipeline

### System Prompt

The LLM is instructed with a strict system prompt that enforces:

1. **Context-only answers** — use only the provided documents, never external knowledge
2. **Honest uncertainty** — explicitly state when context is insufficient
3. **Structured formatting** — bullet points, headers, clear organization
4. **Source citations** — every factual claim must reference `[Source: title]`
5. **Conversation awareness** — leverage prior Q&A for follow-up context

### Context Assembly

```
buildContextPrompt(sources, question, conversationHistory)
  │
  ├── For each of top 5 sources:
  │     "--- Source N: \"title\" (relevance: score) ---"
  │     content.substring(0, 1500)
  │
  ├── Conversation context (if any):
  │     Last 6 messages (3 Q&A pairs)
  │     Each content.substring(0, 500)
  │
  └── "USER QUESTION: <question>"
      "Provide a comprehensive answer based on the context above."
```

### Streaming Architecture

SSE streaming is **Nginx-aware** — the response includes `X-Accel-Buffering: no` to prevent proxy buffering. Errors are sent as SSE events rather than breaking the connection, ensuring the frontend always receives a graceful failure message.

---

## Hybrid Search: Reciprocal Rank Fusion

### Why RRF Over Score Interpolation?

Linear score interpolation (`α * vector_score + (1-α) * text_score`) requires:
- Careful tuning of the α weight parameter
- Score normalization (vector and text scores are on different scales)
- Assumes both score distributions are comparable

**RRF is parameter-free** — it uses only rank positions, not raw scores. This makes it robust to:
- Different score scales between search methods
- Score distribution skew
- Missing results (a document only in one list still gets a score)

### Algorithm Detail

```javascript
function reciprocalRankFusion(vectorResults, textResults, k = 60) {
  const scoreMap = new Map();

  // Score from vector search (rank = position in list)
  vectorResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    scoreMap.set(id, (scoreMap.get(id) || 0) + 1 / (k + rank + 1));
  });

  // Score from text search (same formula)
  textResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    scoreMap.set(id, (scoreMap.get(id) || 0) + 1 / (k + rank + 1));
  });

  // Documents in BOTH lists get higher combined scores
  // Sort by RRF score descending
  return sorted(scoreMap);
}
```

### Threshold Filtering

After RRF merging, results below `1 / (K + limit * 3)` are filtered out. This removes noise — documents that appear at the bottom of only one list and contribute minimal relevance.

---

## Caching Architecture

CompanyMind implements a **3-tier caching strategy** to minimize latency:

```
                     Request: "vector databases"
                              │
                    ┌─────────▼─────────────┐
                    │  Tier 3: Search Cache   │
                    │  200 entries, 5-min TTL │
                    │  Key: "hybrid:query:10" │
                    │                         │
                    │  HIT → return results   │
                    │  MISS ↓                 │
                    └─────────┬───────────────┘
                              │
                    ┌─────────▼─────────────┐
                    │  Tier 2: Node Embed    │
                    │  500 entries, 10-min   │
                    │  Key: lowercase(query) │
                    │                         │
                    │  HIT → skip HTTP call   │
                    │  MISS ↓                 │
                    └─────────┬───────────────┘
                              │ HTTP POST
                    ┌─────────▼─────────────┐
                    │  Tier 1: Python Embed  │
                    │  2000 entries, MD5 key │
                    │                         │
                    │  HIT → skip inference   │
                    │  MISS → run model       │
                    └─────────┬───────────────┘
                              │
                    MiniLM-L6-v2 Inference
                    (~50ms)
```

Each tier is an independent **LRU (Least Recently Used)** implementation:

| Tier | Location | Max Size | TTL | Key Format |
|:-----|:---------|:---------|:----|:-----------|
| Search results | Node.js | 200 | 5 min | `hybrid:<query>:<limit>` |
| Embeddings | Node.js | 500 | 10 min | `text.trim().toLowerCase()` |
| Embeddings | Python | 2,000 | None | `MD5(text)` |

On a cache-warm system, repeated queries return in **< 1ms**.

---

## Database Design

### Document Schema

```javascript
{
  title:      String,    // required, trimmed
  content:    String,    // required, trimmed
  category:   String,    // default: 'uncategorized', trimmed
  tags:      [String],   // default: []
  embedding: [Number],   // required, 384 floats
  createdAt:  Date       // default: Date.now(), IMMUTABLE
}
```

### Indexes

| Index | Type | Purpose |
|:------|:-----|:--------|
| `{ createdAt: -1 }` | B-tree | Chronological listing, recent docs |
| `{ title: 'text', content: 'text' }` | Text | MongoDB `$text` BM25 search |
| `embedding` (Atlas) | HNSW Vector | `$vectorSearch` with cosine similarity |

### Connection Configuration

```javascript
{
  minPoolSize: 5,
  maxPoolSize: 30,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 60000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
  appName: 'CompanyMind-SemanticSearch'
}
```

Key decisions:
- **zlib compression** — reduces MongoDB network traffic significantly
- **Majority write concern** — ensures data durability across replica set
- **Retry reads/writes** — automatic retry on transient network errors
- **Graceful shutdown** — SIGINT/SIGTERM handlers close connections cleanly

---

## Embedding Service

### Model: all-MiniLM-L6-v2

| Property | Value |
|:---------|:------|
| Architecture | 6-layer Transformer (BERT-based) |
| Output dimensions | 384 |
| Max sequence length | 512 tokens |
| Normalization | L2-normalized (`normalize_embeddings=True`) |
| Similarity metric | Cosine similarity (equivalent to dot product after L2 norm) |
| Model size | ~80 MB |
| Inference device | CPU-only (no CUDA required) |

### Why MiniLM-L6-v2?

1. **Speed** — 6 layers vs. 12 (BERT) or 24 (large models). ~50ms per embedding.
2. **Quality** — top performance on semantic similarity benchmarks for its size class
3. **Dimension efficiency** — 384 dims vs. 768 (BERT) or 1536 (OpenAI). Lower storage, faster search.
4. **L2 normalization** — enables cosine similarity via simple dot product, which MongoDB optimizes internally.
5. **Self-hosted** — no API costs, no rate limits, full data privacy.

### Singleton Pattern

The embedding engine uses a **singleton pattern** — the model is loaded exactly once at service startup and reused for all requests. This avoids the ~2-second model load time on every request.

```python
class EmbeddingEngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load_model()  # One-time load
        return cls._instance
```

---

## Middleware Stack

Requests pass through this middleware chain in order:

```
Request → Helmet → CORS → Compression → JSON Parser (1MB limit)
       → Rate Limiter → Response Time Logger → Route Handler
       → Zod Validation → Controller → Service → Response
       → Error Middleware (catches all thrown errors)
       → Not Found (404 for unmatched routes)
```

### Rate Limiting

| Tier | Routes | Limit | Window |
|:-----|:-------|:------|:-------|
| General | `/api/documents`, `/health`, `/api/benchmark` | 100 requests | 1 minute |
| Search | `/api/search`, `/api/ask`, `/api/ask/stream` | 30 requests | 1 minute |

### Validation (Zod)

Every endpoint has a Zod schema. The `validateRequest` middleware accepts a schema and a source (`body` or `query`), validates the request, and returns a 400 with descriptive error messages on failure.

| Schema | Validated Fields |
|:-------|:----------------|
| `createDocumentSchema` | title (1-300), content (1-10000), category? (≤100), tags? (array ≤20, each ≤50) |
| `searchDocumentsQuerySchema` | q (1-1000), page? (≥1), pageSize? (1-50) |
| `askQuestionStreamSchema` | question (1-2000), conversationHistory? (≤20 messages, role enum, content ≤5000) |
| `benchmarkSchema` | query (1-1000), limit? (1-50) |

### Error Handling

```
Custom AppError          →  carries statusCode + message
asyncHandler wrapper     →  catches promise rejections automatically
Error middleware          →  checks AppError vs unknown
  • AppError             →  res.status(statusCode).json({ error })
  • Unknown Error        →  res.status(500).json({ error: 'Internal Server Error' })
  • 5xx errors           →  logged to stderr
SSE errors               →  sent as { type: 'error' } event (never crash stream)
```

---

## Frontend Architecture

### Pages

| Page | Route | Purpose |
|:-----|:------|:--------|
| Dashboard | `/` | KPI cards, category chart, analytics, recent activity |
| Search & Ask | `/search` | Semantic search + RAG with mode toggle |
| Documents | `/documents` | Browse, filter by category, text search |
| Benchmarks | `/benchmarks` | Compare 4 search strategies side-by-side |
| How It Works | `/how-it-works` | RAG pipeline explanation, tech stack details |
| Admin | `/admin` | Add new documents with auto-embedding |

### Key Frontend Decisions

1. **Debounced auto-search** — 450ms debounce triggers search automatically as user types. No "Submit" button needed for search mode.
2. **SSE for RAG streaming** — uses `fetch` with `ReadableStream` reader to process SSE events. Sources displayed immediately, tokens rendered with blinking cursor.
3. **Speech-to-text** — `useSpeechToText` hook wraps Web Speech API. In Ask mode, dictation auto-triggers the AI question.
4. **Pipeline animation** — `SearchPipelineAnimation` component shows animated steps (embed → search → rank) with traveling dot SVGs.
5. **Typed API client** — axios instance with interceptors, base URL from env, typed response interfaces.

---

## Deployment Architecture

### Docker Multi-Stage Build

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS builder
# npm ci → tsc → vite build

# Stage 2: Production runtime
FROM node:20-alpine
# Copy dist/ + server files + node_modules
# Run as non-root appuser
```

### Docker Compose Production

```yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
    depends_on:
      embedding:
        condition: service_healthy
    healthcheck:
      test: wget -q --spider http://localhost:8080/health

  embedding:
    build: ./embedding-service
    ports: ["8000:8000"]
    healthcheck:
      test: curl -f http://localhost:8000/health
```

Key: web service **waits for embedding to be healthy** before starting. Both services have health checks.

### Resilient Startup

The Express server **starts listening immediately** — before the database connection is established. This ensures:
- Health checks pass during cold starts (critical for Render/ECS)
- The `/health` endpoint reports `"connecting"` until MongoDB is ready
- No requests are lost — they queue while the DB connects

```javascript
const server = app.listen(PORT);        // Start immediately
connectToDatabase().then(/* ... */);    // Connect in background
```

---

## Query Analytics

CompanyMind tracks query metrics in-memory for the dashboard:

| Metric | Source |
|:-------|:------|
| Total queries | Circular buffer (500 max) |
| Search vs. Ask split | `queryType` field per entry |
| Average response time | `tookMs` per query |
| Popular queries (top 10) | Frequency aggregation |
| Recent queries (last 20) | Time-sorted slice |

The analytics endpoint (`GET /api/ask/analytics`) returns this data for the Dashboard page's KPI cards and activity feed.

---

## Design Decisions & Trade-offs

| Decision | Rationale |
|:---------|:---------|
| **CommonJS (.cjs)** for backend | Mongoose and some dependencies work most reliably with require(). ESM support varies across the Node ecosystem for server-side code. |
| **Separate embedding service** | ML model runs in Python (best ecosystem), API logic in Node.js (best for Express/MongoDB). Clean separation of concerns. Language-agnostic scaling. |
| **In-memory LRU caches** | Redis would add operational complexity. For a knowledge base with finite queries, in-memory LRU provides sub-millisecond lookups with zero infrastructure. |
| **CPU-only PyTorch** | MiniLM-L6-v2 runs fast enough on CPU (~50ms). GPU would add ~3 GB to Docker image and require NVIDIA runtime. |
| **RRF over learned ranking** | RRF is parameter-free and robust. Learning-to-rank requires training data and tuning — overkill for a hackathon project. |
| **Groq over OpenAI** | Groq's inference speed (Llama 3 70B in 1-3s) allows real-time SSE streaming with minimal perceived latency. Free tier is generous. |
| **Immutable createdAt** | Prevents timestamp manipulation. Documents represent a point-in-time snapshot of knowledge. |
| **$vectorSearch over custom HNSW** | MongoDB Atlas handles index maintenance, replication, and scaling. Building custom HNSW would be reinventing the wheel. |
