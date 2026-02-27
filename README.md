# CompanyMind

**AI-powered knowledge base with semantic search & RAG (Retrieval-Augmented Generation)**

> Built with MongoDB Atlas Vector Search, Sentence Transformers, Groq LLM, React, and Express.js

---

## What It Does

CompanyMind turns your company's documents into a smart, searchable knowledge base. Instead of keyword matching, it understands *meaning* — and can even generate detailed answers from your documents using AI.

### Two Modes

| Mode | Description |
|------|-------------|
| **Semantic Search** | Finds the most relevant documents using vector similarity (cosine distance on 384-dim embeddings) |
| **Ask AI** | Retrieves top matching documents, then uses Groq's Llama 3 (70B) to generate a comprehensive answer with source citations |

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  React + Vite │────▶│  Express.js API   │────▶│  MongoDB Atlas   │
│  (Frontend)   │     │  (Port 8080)      │     │  Vector Search   │
└──────────────┘     └────────┬───────────┘     └──────────────────┘
                              │
                     ┌────────┴───────────┐
                     │                    │
              ┌──────▼──────┐     ┌───────▼──────┐
              │  Embedding   │     │  Groq API    │
              │  Service     │     │  (Llama 3)   │
              │  (FastAPI)   │     │  RAG Engine  │
              │  Port 8000   │     └──────────────┘
              └─────────────┘
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (dark glass-morphism UI)
- **Backend**: Express.js with Zod validation, Helmet, CORS
- **Database**: MongoDB Atlas with `$vectorSearch` aggregation pipeline
- **Embeddings**: FastAPI microservice running `all-MiniLM-L6-v2` (384 dimensions)
- **LLM**: Groq API with `llama-3.3-70b-versatile` for RAG generation
- **Search**: Cosine similarity on vector embeddings, returning top-K results with relevance scores

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/companymind.git
cd companymind
npm install
```

### 2. Configure Environment

Copy the env template and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/companymind?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_key_here
EMBEDDING_SERVICE_URL=http://localhost:8000
PORT=8080
```

### 3. Start Embedding Service

```bash
cd embedding-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Seed Database (first time only)

```bash
node seeds/seedDatabase.cjs
```

### 5. Create Vector Search Index

In MongoDB Atlas, create a Vector Search index on the `documents` collection:

- **Index name**: `documents_embedding_index`
- **Field**: `embedding` (384 dimensions, cosine similarity)

### 6. Run the App

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start searching!

---

## How RAG Works

1. **User asks a question** - sent to `/ask` endpoint
2. **Embedding generated** - question converted to 384-dim vector via MiniLM
3. **Vector search** - MongoDB `$vectorSearch` finds top 5 matching documents
4. **Context assembly** - retrieved documents formatted as context for LLM
5. **LLM generation** - Groq's Llama 3 70B generates answer using ONLY the provided context
6. **Response** - answer + source citations + metadata (time, tokens, model) returned to UI

---

## Project Structure

```
├── src/                    # React frontend
│   ├── pages/              # SearchPage (search + ask), AdminPage (add docs)
│   ├── components/         # Reusable UI (SearchBar, ResultCard, AIAnswer, etc.)
│   ├── api/                # API client functions
│   └── hooks/              # Custom hooks (useDebounce)
├── controllers/            # Express route handlers
├── services/               # Business logic (embedding, RAG, document)
├── routes/                 # Express route definitions
├── models/                 # Mongoose schemas
├── validators/             # Zod validation schemas
├── config/                 # Database & env configuration
├── middleware/              # Error handling, logging
├── embedding-service/      # Python FastAPI embedding microservice
└── seeds/                  # Database seed data
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search?q=...&page=1&limit=10` | Semantic vector search |
| `POST` | `/ask` | Ask AI (RAG) — body: `{ "question": "..." }` |
| `POST` | `/documents` | Add a new document |
| `GET` | `/documents` | List all documents |

---

## Performance

- **Embedding generation**: ~50ms per query (MiniLM-L6-v2)
- **Vector search**: ~20-80ms (MongoDB Atlas $vectorSearch)
- **RAG answer generation**: ~1-3s (Groq Llama 3 70B)
- **Total search latency**: <200ms
- **Total ask latency**: <4s

---

## License

Apache-2.0 license
