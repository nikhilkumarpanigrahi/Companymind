# API Reference

> Complete HTTP API documentation for CompanyMind's Express.js backend and Python embedding service.

---

## Base URLs

| Service | URL | Description |
|:--------|:----|:-----------|
| Web API | `http://localhost:8080` | Express.js backend |
| Embedding | `http://localhost:8000` | Python FastAPI service |

---

## Authentication

No authentication required. Rate limiting is applied per IP address.

| Tier | Routes | Limit |
|:-----|:-------|:------|
| General | `/api/documents`, `/health`, `/api/benchmark` | 100 req/min/IP |
| Search | `/api/search`, `/api/ask`, `/api/ask/stream` | 30 req/min/IP |

Rate limit exceeded responses:

```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

---

## Health Check

### `GET /health`

Returns server health status. Always returns 200 — even during database connection.

**Response:**

```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-02-26T10:00:00.000Z",
  "database": {
    "status": "connected",
    "connections": 5,
    "serverVersion": "7.0.2"
  }
}
```

Database status values: `"connected"`, `"connecting"`, `"disconnected"`

---

## Documents

### `POST /api/documents`

Create a new document. The content is automatically embedded via the embedding service.

**Request Body:**

```json
{
  "title": "Introduction to Vector Databases",
  "content": "Vector databases are specialized database systems designed to store, index, and query high-dimensional vector embeddings...",
  "category": "database",
  "tags": ["vector", "database", "embeddings"]
}
```

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:-----------|
| `title` | string | Yes | 1–300 characters |
| `content` | string | Yes | 1–10,000 characters |
| `category` | string | No | ≤ 100 characters. Default: `"uncategorized"` |
| `tags` | string[] | No | Max 20 tags, each ≤ 50 characters |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "title": "Introduction to Vector Databases",
    "content": "Vector databases are specialized...",
    "category": "database",
    "tags": ["vector", "database", "embeddings"],
    "embedding": [0.032, -0.108, ...],
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

**Errors:**

| Status | Cause |
|:-------|:------|
| 400 | Validation failed (title/content missing or too long) |
| 502 | Embedding service unavailable |

---

### `GET /api/documents`

List all documents (without embeddings).

**Query Parameters:**

| Param | Type | Default | Range |
|:------|:-----|:--------|:------|
| `limit` | number | 100 | 1–500 |

**Response (200):**

```json
{
  "success": true,
  "count": 173,
  "data": [
    {
      "_id": "665a1b2c...",
      "title": "Introduction to Vector Databases",
      "content": "Vector databases are...",
      "category": "database",
      "tags": ["vector", "database"],
      "createdAt": "2026-02-26T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/documents/stats`

Aggregate statistics about the knowledge base.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalDocuments": 173,
    "categories": [
      { "_id": "AI research", "count": 25 },
      { "_id": "database", "count": 18 }
    ],
    "topTags": [
      { "_id": "machine-learning", "count": 12 },
      { "_id": "python", "count": 10 }
    ],
    "recentDocuments": [
      {
        "_id": "665a1b2c...",
        "title": "Latest Document",
        "category": "technology",
        "createdAt": "2026-02-26T10:00:00.000Z"
      }
    ]
  }
}
```

| Field | Description |
|:------|:-----------|
| `categories` | All categories with document counts, sorted descending |
| `topTags` | Top 20 tags by frequency |
| `recentDocuments` | Last 5 documents, sorted by creation date |

---

## Search

### `GET /api/search`

**Hybrid semantic + keyword search** using Reciprocal Rank Fusion. This is the primary search endpoint.

**Query Parameters:**

| Param | Type | Default | Range | Description |
|:------|:-----|:--------|:------|:-----------|
| `q` | string | — | 1–1,000 chars | Search query (required) |
| `page` | number | 1 | ≥ 1 | Page number |
| `pageSize` | number | 10 | 1–50 | Results per page |

**Example:**

```
GET /api/search?q=how%20do%20vector%20databases%20work&page=1&pageSize=5
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "_id": "665a1b2c...",
        "title": "Vector Databases Explained",
        "content": "Vector databases store data as high-dimensional vectors...",
        "category": "database",
        "tags": ["vector", "database"],
        "relevanceScore": 0.8742,
        "createdAt": "2026-02-26T10:00:00.000Z"
      }
    ],
    "totalResults": 15,
    "page": 1,
    "pageSize": 5,
    "totalPages": 3,
    "tookMs": 142,
    "query": "how do vector databases work"
  }
}
```

| Field | Description |
|:------|:-----------|
| `relevanceScore` | Cosine similarity (0–1). Higher = more semantically similar. ≥0.8 is strong. |
| `tookMs` | Total end-to-end latency including embedding + search + RRF merge |

---

### `POST /api/search`

**Pure vector search** (no keyword component). Used for API-to-API integration.

**Request Body:**

```json
{
  "query": "machine learning fundamentals",
  "limit": 10
}
```

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:-----------|
| `query` | string | Yes | 1–1,000 characters |
| `limit` | number | No | 1–50, default 10 |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "665a1b2c...",
      "title": "Machine Learning Overview",
      "content": "Machine learning is a subset of AI...",
      "category": "AI research",
      "tags": ["ml", "ai"],
      "relevanceScore": 0.9102,
      "createdAt": "2026-02-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "query": "machine learning fundamentals",
    "tookMs": 98,
    "resultCount": 10
  }
}
```

---

## Ask AI (RAG)

### `POST /api/ask`

Generate a non-streaming AI answer using retrieved documents.

**Request Body:**

```json
{
  "question": "How does vector search differ from keyword search?"
}
```

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:-----------|
| `question` | string | Yes | 1–2,000 characters |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "answer": "Vector search fundamentally differs from keyword search in how it represents and matches information...\n\n[Source: Vector Databases Explained] [Source: Semantic Search Architecture]",
    "sources": [
      {
        "title": "Vector Databases Explained",
        "category": "database",
        "relevanceScore": 0.8742
      },
      {
        "title": "Semantic Search Architecture",
        "category": "AI research",
        "relevanceScore": 0.8215
      }
    ],
    "meta": {
      "model": "llama-3.3-70b-versatile",
      "tokensUsed": 487,
      "sourcesUsed": 5,
      "tookMs": 2340
    }
  }
}
```

---

### `POST /api/ask/stream`

**Server-Sent Events (SSE) streaming** RAG answer. Recommended for real-time UIs.

**Request Body:**

```json
{
  "question": "Explain the RAG pipeline",
  "conversationHistory": [
    { "role": "user", "content": "What is semantic search?" },
    { "role": "assistant", "content": "Semantic search uses vector embeddings to find documents by meaning..." }
  ]
}
```

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:-----------|
| `question` | string | Yes | 1–2,000 characters |
| `conversationHistory` | array | No | Max 20 entries |
| `conversationHistory[].role` | string | Yes | `"user"` or `"assistant"` |
| `conversationHistory[].content` | string | Yes | ≤ 5,000 characters |

**Response Headers:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**SSE Event Stream:**

```
data: {"type":"sources","sources":[{"title":"RAG Architecture","category":"AI research","relevanceScore":0.89}]}

data: {"type":"token","content":"The"}

data: {"type":"token","content":" RAG"}

data: {"type":"token","content":" pipeline"}

... (hundreds of token events)

data: {"type":"done","meta":{"model":"llama-3.3-70b-versatile","tookMs":2150},"fullAnswer":"The RAG pipeline works by..."}
```

**Event Types:**

| Type | When | Payload |
|:-----|:-----|:--------|
| `sources` | Immediately after search | `{ sources: Source[] }` |
| `token` | As LLM generates each token | `{ content: string }` |
| `done` | Generation complete | `{ meta, fullAnswer }` |
| `error` | On failure | `{ error: string }` |

---

### `GET /api/ask/analytics`

Query analytics from in-memory log.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalQueries": 142,
    "askCount": 45,
    "searchCount": 97,
    "avgResponseTime": 186.5,
    "popularQueries": [
      { "query": "vector databases", "count": 8 },
      { "query": "machine learning", "count": 5 }
    ],
    "recentQueries": [
      {
        "query": "how does RAG work",
        "type": "ask-stream",
        "timestamp": "2026-02-26T10:00:00.000Z",
        "tookMs": 2340
      }
    ]
  }
}
```

---

## Benchmark

### `POST /api/benchmark`

Run a query through 4 search methods and compare results.

**Request Body:**

```json
{
  "query": "database optimization techniques",
  "limit": 10
}
```

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:-----------|
| `query` | string | Yes | 1–1,000 characters |
| `limit` | number | No | 1–50, default 10 |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "query": "database optimization techniques",
    "limit": 10,
    "embeddingTimeMs": 48,
    "methods": [
      {
        "method": "Regex ($regex)",
        "key": "regex",
        "latencyMs": 156.2,
        "resultCount": 10,
        "avgScore": 0.0,
        "results": [
          {
            "_id": "665a1b2c...",
            "title": "Database Indexing Strategies",
            "category": "database",
            "score": 0
          }
        ]
      },
      {
        "method": "Full-Text ($text)",
        "key": "text",
        "latencyMs": 12.4,
        "resultCount": 10,
        "avgScore": 3.21,
        "results": [...]
      },
      {
        "method": "Vector ($vectorSearch)",
        "key": "vector",
        "latencyMs": 45.8,
        "resultCount": 10,
        "avgScore": 0.824,
        "results": [...]
      },
      {
        "method": "Hybrid (RRF)",
        "key": "hybrid",
        "latencyMs": 67.3,
        "resultCount": 10,
        "avgScore": 0.031,
        "results": [...]
      }
    ],
    "overlapMatrix": {
      "regex_text": 0.4,
      "regex_vector": 0.2,
      "regex_hybrid": 0.3,
      "text_vector": 0.5,
      "text_hybrid": 0.7,
      "vector_hybrid": 0.9
    }
  }
}
```

| Field | Description |
|:------|:-----------|
| `embeddingTimeMs` | Time to generate query embedding (excluded from method latencies) |
| `overlapMatrix` | Jaccard-style overlap — fraction of shared document IDs between each method pair |
| `avgScore` | Average score (cosine for vector, textScore for text, RRF score for hybrid, 0 for regex) |

---

## Embedding Service API

### `GET /health`

Embedding service health and status.

**Response (200):**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "all-MiniLM-L6-v2",
  "embedding_dimension": 384,
  "cache_stats": {
    "size": 142,
    "max_size": 2000,
    "hits": 1205,
    "misses": 142,
    "hit_rate": 0.894
  }
}
```

---

### `POST /embed-query`

Generate a single embedding vector.

**Request Body:**

```json
{
  "text": "How do vector databases work?"
}
```

**Response (200):**

```json
{
  "embedding": [0.032, -0.108, 0.054, ...],
  "dimension": 384,
  "model": "all-MiniLM-L6-v2"
}
```

The embedding is L2-normalized (unit vector), so cosine similarity = dot product.

---

### `POST /embed-batch`

Generate embeddings for multiple texts in one request.

**Request Body:**

```json
{
  "texts": [
    "Introduction to vector databases",
    "Machine learning fundamentals",
    "Cloud computing architecture"
  ]
}
```

| Field | Type | Constraints |
|:------|:-----|:-----------|
| `texts` | string[] | Max 512 texts per batch |

**Response (200):**

```json
{
  "embeddings": [
    [0.032, -0.108, ...],
    [0.015, 0.092, ...],
    [-0.041, 0.067, ...]
  ],
  "dimension": 384,
  "model": "all-MiniLM-L6-v2",
  "count": 3
}
```

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

### Status Codes

| Code | Meaning | Example |
|:-----|:--------|:--------|
| 400 | Validation error | Missing required field, value out of range |
| 404 | Not found | Unknown route |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Unexpected internal failure |
| 502 | Bad gateway | Embedding service unavailable or returned invalid data |

### Validation Errors

Zod validation returns concatenated field-level messages:

```json
{
  "success": false,
  "error": "title: String must contain at least 1 character(s); content: Required"
}
```
