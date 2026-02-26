# Setup Guide

> Step-by-step instructions to get CompanyMind running from scratch.

---

## Prerequisites

| Requirement | Version | Notes |
|:-----------|:--------|:------|
| **Node.js** | 18+ | [Download](https://nodejs.org/) |
| **Python** | 3.9+ | [Download](https://www.python.org/downloads/) |
| **MongoDB Atlas** | Free M0 | [Sign up](https://www.mongodb.com/cloud/atlas/register) |
| **Groq API Key** | Free | [Get key](https://console.groq.com) |
| **Git** | Any | [Download](https://git-scm.com/) |

---

## Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/nikhilkumarpanigrahi/Companymind.git
cd Companymind

# Node.js dependencies
npm install

# Python dependencies for the embedding service
cd embedding-service
pip install -r requirements.txt
cd ..
```

---

## Step 2: Create a MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign in
2. Click **"Build a Database"** → **M0 Free Tier**
3. Choose **AWS** (recommended) and your nearest region
4. Click **"Create Deployment"**
5. **Create a database user** — save the username and password
6. **Network Access** → **"Add My Current IP Address"** (or `0.0.0.0/0` for development)
7. Click **"Connect"** → **"Drivers"** → copy the connection string

Your connection string will look like:

```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 3: Configure Environment Variables

Create (or edit) the `.env` file in the project root:

```env
# MongoDB Atlas connection (replace with YOUR credentials)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/companymind?retryWrites=true&w=majority

# Groq API key for RAG (LLM answer generation)
GROQ_API_KEY=gsk_your_key_here

# Embedding service URL (local default)
EMBEDDING_API_URL=http://localhost:8000/embed-query

# Frontend API base URL
VITE_API_BASE_URL=http://localhost:8080

# Server port
PORT=8080

# Vector search index name (must match Step 4)
VECTOR_INDEX_NAME=documents_embedding_index
```

Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual Atlas credentials.

---

## Step 4: Create the Vector Search Index

This is the critical step that enables semantic search.

1. In MongoDB Atlas, navigate to your cluster → **"Browse Collections"**
2. The `companymind` database will be created automatically when you seed data (Step 6)
3. Go to the **"Atlas Search"** tab → **"Create Search Index"**
4. Choose **"JSON Editor"**
5. Select the `companymind.documents` collection
6. Set the index name to: `documents_embedding_index`
7. Paste this JSON definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
```

8. Click **"Create Search Index"**
9. Wait for the status to show **"Active"** (~1 minute)

> **Why 384 dimensions?** The `all-MiniLM-L6-v2` embedding model produces 384-dimensional vectors. This must match exactly.

---

## Step 5: Start the Embedding Service

The embedding service converts text into 384-dimensional vectors using the MiniLM-L6-v2 model.

```bash
cd embedding-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Wait until you see the model loaded message. The **first run** takes longer as it downloads the model (~80 MB).

Verify it's running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "all-MiniLM-L6-v2",
  "embedding_dimension": 384
}
```

---

## Step 6: Seed the Database

With the embedding service running, open a **new terminal**:

```bash
npm run db:seed
```

This will:
1. Connect to your MongoDB Atlas cluster
2. Load 173 sample documents from `seeds/sample-documents.json`
3. Generate 384-dimensional vector embeddings for each document
4. Insert all documents into the `companymind.documents` collection

Documents are processed in batches of 25. It takes approximately 1–3 minutes.

**Expected output:**

```
🚀 Starting database seeding...
✅ Connected to MongoDB
✅ Embedding service is healthy
📄 Loaded 173 documents from sample data
🔄 Processing batch 1/7...
🔄 Processing batch 2/7...
...
✅ Successfully seeded 173 documents
```

---

## Step 7: Start the Application

Open **two more terminals**:

**Terminal 2 — Backend API:**

```bash
npm run dev:server
```

Backend runs at `http://localhost:8080`. You should see:

```
Server listening on port 8080
Database connected successfully
```

**Terminal 3 — Frontend:**

```bash
npm run dev
```

Frontend runs at `http://localhost:5173` (default Vite port).

---

## Step 8: Verify Everything Works

### 8a. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

### 8b. Try Semantic Search

Type a query in the search bar. Results should appear ranked by semantic relevance.

| Query | Expected Results |
|:------|:----------------|
| "how do vector databases work" | Vector DB, HNSW, similarity search docs |
| "machine learning for beginners" | ML intro, deep learning, data science docs |
| "speed up my application" | Caching, indexing, optimization docs |
| "building REST APIs" | RESTful design, Express.js, Node.js docs |
| "database performance" | Indexing strategies, query optimization docs |
| "deploying to the cloud" | AWS Lambda, Kubernetes, Docker, CI/CD docs |
| "protecting web apps from hackers" | XSS/CSRF, cybersecurity, OWASP docs |
| "how transformers work in AI" | Transformer architecture, attention, BERT docs |

### 8c. Try Ask AI

Switch to the **"Ask AI"** mode and ask a question. You should see:
- Source documents listed immediately
- Answer streamed token-by-token with a blinking cursor
- Source citations in the answer text

### 8d. Check the Dashboard

Navigate to the Dashboard page to see:
- Total document count
- Category distribution
- Top tags
- Query analytics (after performing some searches)

---

## Alternative: Docker Setup

If you prefer Docker, you can run everything with one command:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

This builds both services with multi-stage Docker builds:
- Web service on port 8080
- Embedding service on port 8000
- ML model baked into the image (no cold-start download)
- Health checks configured

You still need to:
1. Set `MONGODB_URI` and `GROQ_API_KEY` in `.env`
2. Create the Vector Search index in Atlas (Step 4)
3. Seed the database (Step 6)

---

## Troubleshooting

| Problem | Solution |
|:--------|:---------|
| `MONGODB_URI is required` | Ensure `.env` has your actual connection string |
| `connect ECONNREFUSED :8000` | Start the embedding service first (Step 5) |
| Seeding fails with auth error | Check your Atlas username/password in `.env` |
| Search returns 0 results | Verify the Vector Search index is "Active" in Atlas |
| Vector index errors | Ensure index uses **384** dimensions, not 1536 |
| Frontend can't reach backend | Ensure `VITE_API_BASE_URL=http://localhost:8080` in `.env` |
| Model download is slow | First run downloads ~80 MB model; subsequent runs use cache |
| `EADDRINUSE` port error | Another process is using port 8080 or 8000. Kill it or change ports |
| "No text index" warning | This is normal — text search will gracefully degrade. The text index is created automatically by Mongoose. |
| Docker build fails | Ensure Docker has at least 4 GB memory allocated |
| SSE streaming not working | If behind a reverse proxy (Nginx), ensure `proxy_buffering off;` is set |

---

## Available Commands

| Command | Description |
|:--------|:-----------|
| `npm run dev` | Start Vite frontend dev server (hot reload) |
| `npm run dev:server` | Start Express backend with nodemon (auto-restart) |
| `npm run start:server` | Start Express backend (production, no auto-restart) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run db:seed` | Seed 173 curated tech documents |
| `npm run db:seed:large` | Seed from `seeds/large-dataset.json` |
| `npm run generate:dataset` | Generate ~2,000 template-based documents |
| `npm run load:documents` | Bulk load from JSONL file |
| `npm run clean:dataset` | Clean/normalize dataset files |

---

## Service Summary

When everything is running, you should have 3 processes:

| Terminal | Command | Port | Status |
|:---------|:--------|:-----|:-------|
| 1 | `uvicorn app.main:app` | 8000 | Embedding service (model loaded) |
| 2 | `npm run dev:server` | 8080 | Express API (database connected) |
| 3 | `npm run dev` | 5173 | Vite frontend (hot reload) |

---

## Next Steps

- Read the [Architecture](ARCHITECTURE.md) document to understand the system design
- Explore the [API Reference](API_REFERENCE.md) for all available endpoints
- Try the **Benchmarks** page to compare search strategies
- Add your own documents via the **Admin** page
