# CompanyMind - Complete Setup Guide

> **Step-by-step guide to get CompanyMind running from scratch.**

---

## Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.9+ (for the embedding service)
- **MongoDB Atlas** free account ([signup here](https://www.mongodb.com/cloud/atlas/register))
- **Git** (to clone the repo)

---

## Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for the embedding service
cd embedding-service
pip install -r requirements.txt
cd ..
```

---

## Step 2: Create a MongoDB Atlas Free Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign in
2. Click **"Build a Database"** → Select **M0 Free Tier**
3. Choose a cloud provider (AWS recommended) and region closest to you
4. Click **"Create Deployment"**
5. **Create a database user**: Set a username and password (save these!)
6. **Network access**: Click "Add My Current IP Address" (or add `0.0.0.0/0` for development)
7. Click **"Connect"** → **"Drivers"** → Copy the connection string

Your connection string looks like:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 3: Configure Environment Variables

Edit the `.env` file in the project root:

```env
# Replace with YOUR MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/companymind?retryWrites=true&w=majority

# These should stay as-is:
PORT=8080
VITE_API_BASE_URL=http://localhost:8080
EMBEDDING_API_URL=http://localhost:8000/embed-query
VECTOR_INDEX_NAME=documents_embedding_index
```

**Important**: Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual Atlas credentials.

---

## Step 4: Create the Vector Search Index in Atlas

1. In MongoDB Atlas, go to your cluster → **"Browse Collections"**
2. The `companymind` database will be created automatically when you seed data
3. Go to **"Atlas Search"** tab → Click **"Create Search Index"**
4. Choose **"JSON Editor"** 
5. Select the `companymind.documents` collection
6. Set index name to: `documents_embedding_index`
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
9. Wait for status to show **"Active"** (takes ~1 minute)

> **Why 384 dimensions?** The embedding service uses the `all-MiniLM-L6-v2` model which produces 384-dimensional vectors.

---

## Step 5: Start the Embedding Service

The embedding service generates vector embeddings from text. Start it first:

```bash
cd embedding-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Wait until you see the model loaded message. First run takes longer as it downloads the model (~80MB).

Verify it's running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","model_loaded":true,...}
```

---

## Step 6: Seed the Database

With the embedding service running, open a **new terminal** and run:

```bash
npm run db:seed
```

This will:
- Connect to your MongoDB Atlas cluster
- Load 173 sample documents from `seeds/sample-documents.json`
- Generate 384-dimensional vector embeddings for each document via the Python API
- Insert all documents into the `companymind.documents` collection

The seeding processes documents in batches of 10. It takes approximately 1-3 minutes depending on your hardware.

**Expected output:**
```
🚀 Starting database seeding...
✅ Connected to MongoDB
✅ Embedding service is healthy
📄 Loaded 173 documents from sample data
🔄 Processing batch 1/18...
🔄 Processing batch 2/18...
...
✅ Successfully seeded 173 documents
```

---

## Step 7: Start the Application

Open **two terminals**:

**Terminal 1 - Backend API:**
```bash
npm run dev:server
```
Backend runs at `http://localhost:8080`

**Terminal 2 - Frontend (Vite):**
```bash
npm run dev
```
Frontend runs at `http://localhost:5173` (default Vite port)

---

## Step 8: Test Semantic Search

1. Open `http://localhost:5173` in your browser
2. Type a query like **"how do vector databases work"** in the search bar
3. Results should appear ranked by semantic relevance

### Example Queries to Try:
| Query | What it should find |
|-------|-------------------|
| "how do vector databases work" | Vector databases, HNSW, similarity search docs |
| "machine learning for beginners" | ML intro, deep learning, data science lifecycle |
| "building REST APIs" | RESTful API design, Express.js, Node.js docs |
| "database performance" | Indexing strategies, query optimization, connection pooling |
| "deploying to the cloud" | AWS Lambda, Kubernetes, Docker, CI/CD docs |
| "protecting web apps from hackers" | XSS/CSRF, cybersecurity, OWASP, DevSecOps docs |
| "how transformers work in AI" | Transformer architecture, attention mechanisms, BERT |
| "company knowledge search" | Knowledge management, semantic search docs |

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   React UI  │────▶│  Express.js API  │────▶│   MongoDB Atlas     │
│  (Vite)     │     │  (Port 8080)     │     │   (Vector Search)   │
│  Port 5173  │     │                  │     │                     │
└─────────────┘     └────────┬─────────┘     └─────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Python FastAPI   │
                    │  Embedding Service│
                    │  (Port 8000)      │
                    │  MiniLM-L6-v2     │
                    └──────────────────┘
```

**Search Flow:**
1. User types a query in the React frontend
2. Frontend sends GET/POST to Express.js API (`/search`)
3. API calls Python embedding service to convert query text → 384-dim vector
4. API runs `$vectorSearch` aggregation on MongoDB Atlas
5. Atlas finds documents with the most similar vectors (cosine similarity)
6. Results are returned ranked by relevance score

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI is required` | Make sure `.env` has your actual connection string |
| `connect ECONNREFUSED :8000` | Start the embedding service first (Step 5) |
| Seeding fails with auth error | Check your Atlas username/password in `.env` |
| Search returns no results | Verify the vector search index is "Active" in Atlas |
| Vector index errors | Ensure index uses `384` dimensions, not `1536` |
| Frontend can't reach backend | Check both use PORT=8080 in `.env` |
| Model download slow | First run downloads ~80MB model; subsequent runs use cache |

---

## Useful Commands

```bash
npm run dev:server      # Start backend API
npm run dev             # Start frontend (Vite)
npm run db:seed         # Seed database with 173 documents
npm run db:stats        # Check database health/stats
npm run benchmark       # Run performance benchmarks
npm run test:relevance  # Run relevance tests
npm run build           # Build frontend for production
```
