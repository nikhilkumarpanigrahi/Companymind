const { generateEmbedding } = require('../services/embeddingService.cjs');
const {
  createDocument,
  listDocuments,
  getDocumentStats,
  vectorSearchDocuments,
  hybridSearchDocuments
} = require('../services/documentService.cjs');
const { Document } = require('../models/Document.cjs');
const { asyncHandler } = require('../utils/asyncHandler.cjs');
const { logQuery } = require('./ragController.cjs');

const createDocumentHandler = asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body;
  const embedding = await generateEmbedding(content);

  const docData = { title, content, embedding };
  if (category) docData.category = category;
  if (tags && tags.length > 0) docData.tags = tags;

  const document = await createDocument(docData);

  return res.status(201).json({
    success: true,
    data: {
      id: document._id,
      title: document.title,
      content: document.content,
      category: document.category,
      tags: document.tags,
      createdAt: document.createdAt
    }
  });
});

const searchDocumentsHandler = asyncHandler(async (req, res) => {
  const { query, limit } = req.body;
  const embedding = await generateEmbedding(query);
  const results = await vectorSearchDocuments({ embedding, limit });

  return res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

const searchDocumentsQueryHandler = asyncHandler(async (req, res) => {
  const { q, page = 1, pageSize = 10 } = req.query;
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const startedAt = process.hrtime.bigint();

  // Fetch enough results for good relevance ranking
  const maxResults = Math.max(pageSizeNum * 5, 100);
  const embedding = await generateEmbedding(q);

  // Use RRF hybrid search (vector + keyword) for best relevance
  const results = await hybridSearchDocuments({ embedding, query: q, limit: maxResults });

  const allMapped = results.map((item) => ({
    id: item._id?.toString(),
    title: item.title || 'Untitled',
    snippet: (item.content || '').slice(0, 220),
    relevanceScore: typeof item.score === 'number' ? item.score : 0
  }));

  // Get true total count for pagination (count matching docs or total DB docs)
  const total = allMapped.length;
  const start = (pageNum - 1) * pageSizeNum;
  const pageResults = allMapped.slice(start, start + pageSizeNum);

  const finishedAt = process.hrtime.bigint();
  const tookMs = Number(finishedAt - startedAt) / 1_000_000;

  logQuery('search', q, Number(tookMs.toFixed(2)));

  return res.status(200).json({
    results: pageResults,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    tookMs: Number(tookMs.toFixed(2))
  });
});

const getDocumentsHandler = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const documents = await listDocuments(limit);

  return res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

const getStatsHandler = asyncHandler(async (_req, res) => {
  const stats = await getDocumentStats();

  return res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  createDocumentHandler,
  searchDocumentsHandler,
  searchDocumentsQueryHandler,
  getDocumentsHandler,
  getStatsHandler
};
