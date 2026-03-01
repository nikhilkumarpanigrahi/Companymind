# CompanyMind — MongoDB Hackathon Demo Script
## 3–4 Minute Video Recording Guide

---

## PRE-RECORDING CHECKLIST

- [ ] All 3 servers running (Embedding :8000, Express :8080, Vite :5173)
- [ ] Browser open at `http://localhost:5173/` (Greeting page)
- [ ] Screen resolution: 1920×1080 (or 1280×720 minimum)
- [ ] Close unnecessary tabs/apps for clean screen
- [ ] Test the Search, Comparison, and Dashboard pages work
- [ ] Pre-load a query in the Comparison page so results are warm

---

## SCRIPT

### [0:00 – 0:25] INTRO — The Problem (Show: Greeting Page)

**SCREEN:** Greeting page with CompanyMind logo

> "Hey everyone, I'm [Your Name], and this is **CompanyMind** — an AI-powered knowledge base built entirely on **MongoDB Atlas**.
>
> Here's the problem every company faces: employees waste hours searching for information buried across thousands of internal documents. Traditional keyword search **fails** because if you search for 'how to speed up queries', it completely misses a document titled 'Database Indexing Strategies' — the keywords don't match, even though that's exactly what you need.
>
> CompanyMind solves this with **MongoDB Atlas Vector Search**."

**ACTION:** Click "Get Started" → redirects to Dashboard

---

### [0:25 – 0:55] DASHBOARD — Scale & Architecture (Show: Dashboard Page)

**SCREEN:** Dashboard with live stats

> "Here's our live dashboard — we're running against **over 2,000 real documents** in MongoDB Atlas right now. You can see the category distribution, top tags, and recent activity — all powered by MongoDB aggregation pipelines.
>
> The architecture is what makes this powerful: we have a **React frontend**, an **Express.js API**, a **Python FastAPI microservice** running the `all-MiniLM-L6-v2` sentence transformer for embeddings, **MongoDB Atlas** with `$vectorSearch`, and **Groq's Llama 3 70B** for RAG.
>
> Every document gets converted into a **384-dimensional vector embedding** and stored directly in MongoDB — no separate vector database needed. That's the key: **MongoDB handles everything** — documents, vectors, text indexes, and aggregation — all in one platform."

**ACTION:** Click "Search & Ask AI" in sidebar

---

### [0:55 – 1:50] LIVE DEMO — Semantic Search + RAG (Show: Search Page)

**SCREEN:** Search page

> "Let me show you the magic. I'll search for something where keywords would fail..."

**ACTION:** Type: `how to speed up database queries` → hit Enter

> "Look at these results — it found documents about **Database Indexing Strategies**, **Query Optimization**, **Caching Techniques** — none of these contain the exact words 'speed up', but MongoDB `$vectorSearch` understood the **meaning** using cosine similarity on the vector embeddings. Each result shows a relevance score from 0 to 1.
>
> But we go further. Let me ask the AI..."

**ACTION:** Switch to "Ask AI" tab (if separate) or type: `How can I optimize MongoDB queries for large datasets?`

> "Now the RAG pipeline kicks in: the query is embedded, `$vectorSearch` retrieves the top 5 matching documents, those are assembled as context, and Groq's **Llama 3 70B** generates a comprehensive answer — all with **source citations** so you can verify every claim.
>
> Look at the metadata: you can see the response time, tokens used, and which model generated the answer. The sources are clickable — full transparency."

---

### [1:50 – 2:45] SEARCH COMPARISON — Proof It Works (Show: Comparison Page)

**SCREEN:** Search Comparison page

> "Now, don't just take my word for it — let me **prove** it's better. This is our real-time Search Comparison page."

**ACTION:** Click "Search Comparison" → Type `machine learning algorithms` → Click "Compare"

> "We just ran the **exact same query** through **4 different MongoDB search strategies** on our live database:
>
> **Regex** — brute force `$regex` scan. It's slow because it checks every single document.
>
> **Text Index** — MongoDB's built-in `$text` search with stemming. Faster, but still only matches keywords.
>
> **Vector Search** — MongoDB Atlas `$vectorSearch` with cosine similarity on our 384-dim embeddings. Look how much faster it is, and the relevance scores are significantly higher.
>
> **Hybrid** — our best approach: vector search **plus** keyword boosting re-ranking. Best of both worlds.
>
> Look at the side-by-side results — the AI search found conceptually relevant documents that keyword search completely missed. **This is real data, real timing, running against our actual MongoDB cluster right now.**"

**ACTION:** Scroll to show the side-by-side result comparison and the "How CompanyMind Improves Search" section

---

### [2:45 – 3:20] WHAT MAKES US DIFFERENT (Show: Comparison Page insights)

> "Here's what sets CompanyMind apart:
>
> **First** — we use MongoDB for **everything**. Documents, vector embeddings, text indexes, aggregation analytics — all in one platform. No Pinecone, no Weaviate, no separate vector DB. MongoDB Atlas Vector Search handles it natively with HNSW indexing.
>
> **Second** — our hybrid search pipeline. We don't just do vector OR keyword — we combine `$vectorSearch` with application-level keyword boosting, so exact matches are promoted while conceptual results are still included.
>
> **Third** — the full RAG pipeline with **streaming**. Answers stream token-by-token from Groq's Llama 3 70B, with source citations that link back to actual documents in MongoDB.
>
> **Fourth** — server-side pagination, debounced search, compound indexes — we optimized for production-scale performance. This isn't a toy demo — it handles thousands of documents efficiently."

---

### [3:20 – 3:50] DOCUMENTS + ADD (Quick flash: Documents Page → Admin Page)

**ACTION:** Click "Documents" in sidebar

> "Here's our document library — over 2,000 documents with server-side pagination, category filtering, and search. All stored in MongoDB with vector embeddings generated on ingest."

**ACTION:** Click "Add Document" in sidebar

> "And adding new knowledge is simple — enter a title, content, and category. The embedding is generated automatically by our FastAPI microservice and stored in MongoDB alongside the document."

---

### [3:50 – 4:00] CLOSING

**SCREEN:** Dashboard or Greeting page

> "CompanyMind — turning your company's documents into an intelligent, searchable knowledge base. Built on **MongoDB Atlas Vector Search**, powered by **Groq Llama 3**, and designed for real-world scale.
>
> Thank you!"

---

## KEY TALKING POINTS TO EMPHASIZE

| Point | Why It Matters |
|-------|---------------|
| **MongoDB Atlas Vector Search ($vectorSearch)** | Core of the hackathon — show it's native, no external vector DB |
| **384-dim embeddings in MongoDB** | Vectors stored alongside documents — single source of truth |
| **HNSW cosine similarity** | Fast approximate nearest neighbor — O(log n) not O(n) |
| **Hybrid search (vector + keyword)** | Shows sophistication beyond basic vector search |
| **Real-time benchmark comparison** | Proves the claims with live data, not slides |
| **RAG with streaming + citations** | Production-grade AI, not just search |
| **Full-stack on MongoDB** | Documents, vectors, text index, aggregations, analytics — one platform |
| **2000+ real documents** | Scale, not toy data |

## RECORDING TIPS

1. **Pace yourself** — speak slightly slower than normal, audiences need time to process
2. **Pause on results** — let the viewer read search results and scores for 2-3 seconds
3. **Point with your cursor** — hover over scores, latency numbers, source citations
4. **Pre-warm** — run each demo query once before recording so MongoDB cache makes timings realistic
5. **Show the Comparison page prominently** — it's your strongest proof point
6. **Mention "MongoDB" by name** at least 5-6 times throughout
7. **Keep the energy up** — you're solving a real problem, show enthusiasm
