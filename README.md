# Companymind Frontend

Production-ready React frontend built with Vite + Tailwind.

## Features

- Google-style centered search bar
- Result cards with title, snippet preview, relevance score
- Response time indicator
- Debounced search input
- Loading animation
- Error toast notifications
- Admin page to add documents
- Axios API integration
- Environment-based API config
- Responsive, modern, minimal UI
- Pagination support

## Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS
- Axios
- React Router

## Setup

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Create env file:

```bash
cp .env.example .env
```

4. Start dev server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Environment Variables

- `VITE_API_BASE_URL` (default: `http://localhost:8080`)
- `VITE_DEFAULT_PAGE_SIZE` (default: `10`)

## API Contract

### Search

- Endpoint: `GET /search`
- Query params: `q`, `page`, `pageSize`
- Supported response shape:

```json
{
  "results": [
    {
      "id": "doc-1",
      "title": "Example",
      "snippet": "Preview text",
      "relevanceScore": 0.92
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "tookMs": 42
}
```

### Add document

- Endpoint: `POST /documents`
- Body:

```json
{
  "title": "Document title",
  "content": "Document content"
}
```