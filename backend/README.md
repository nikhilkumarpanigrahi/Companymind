# Semantic Search Backend (Node.js + Express + MongoDB Atlas)

Scalable backend API using MVC architecture, Atlas vector search, and Python embedding generation.

## Folder Structure

```text
.
├── .env.example
├── mongodb-vector-index.json
├── package.json
├── src
│   ├── app.js
│   ├── server.js
│   ├── config
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers
│   │   └── documentController.js
│   ├── middleware
│   │   ├── errorMiddleware.js
│   │   ├── notFound.js
│   │   ├── responseTimeLogger.js
│   │   └── validateRequest.js
│   ├── models
│   │   └── Document.js
│   ├── routes
│   │   ├── documentRoutes.js
│   │   └── searchRoutes.js
│   ├── services
│   │   ├── documentService.js
│   │   └── embeddingService.js
│   ├── utils
│   │   ├── AppError.js
│   │   └── asyncHandler.js
│   └── validators
│       └── documentValidators.js
└── LICENSE
```

## Data Schema

```js
{
  title: String,
  content: String,
  embedding: [Number],
  createdAt: Date
}
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and update values.

3. Run server:

```bash
npm run dev
```

## API Endpoints

- `POST /documents`
  - Validates request body (`title`, `content`)
  - Calls Python embedding API
  - Saves document with embedding in MongoDB Atlas

- `POST /search`
  - Validates request body (`query`, `limit`)
  - Generates embedding for query
  - Runs `$vectorSearch` using configured vector index

- `GET /documents?limit=100`
  - Returns recent documents (embedding omitted for bandwidth efficiency)

## Example Requests

Create document:

```bash
curl -X POST http://localhost:8080/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Doc A","content":"MongoDB Atlas vector search is powerful."}'
```

Search documents:

```bash
curl -X GET "http://localhost:8080/search?q=semantic%20retrieval%20with%20vectors&page=1&pageSize=5"
```

Alternative (legacy body search):

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query":"semantic retrieval with vectors","limit":5}'
```

`GET /search` response format is frontend-compatible:

```json
{
  "results": [
    {
      "id": "...",
      "title": "...",
      "snippet": "...",
      "relevanceScore": 0.91
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 5,
  "tookMs": 23.17
}
```

## MongoDB Atlas Vector Index Example

Use `mongodb-vector-index.json` with Atlas Search index creation (for collection `documents`):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

Set `VECTOR_INDEX_NAME` in `.env` to match your Atlas index name.

## Performance & Architecture Notes

- MVC + service layer for clean separation of concerns.
- `lean()` reads for lower query overhead.
- Projection excludes embedding on list endpoint to reduce payload size.
- Keep-alive HTTP client for embedding API calls.
- Tuned MongoDB connection pool options.
- Centralized async error handling and validation for reliable API behavior.