const { generateEmbedding } = require('../services/embeddingService.cjs');
const {
  createDocument,
  listDocuments,
  getDocumentStats,
  vectorSearchDocuments
} = require('../services/documentService.cjs');
const { asyncHandler } = require('../utils/asyncHandler.cjs');

const createDocumentHandler = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const embedding = await generateEmbedding(content);

  const document = await createDocument({ title, content, embedding });

  return res.status(201).json({
    success: true,
    data: {
      id: document._id,
      title: document.title,
      content: document.content,
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
  const { q, page, pageSize } = req.query;
  const startedAt = process.hrtime.bigint();
  const embedding = await generateEmbedding(q);
  const results = await vectorSearchDocuments({ embedding, limit: pageSize });

  const mappedResults = results.map((item) => ({
    id: item._id?.toString(),
    title: item.title || 'Untitled',
    snippet: (item.content || '').slice(0, 220),
    relevanceScore: typeof item.score === 'number' ? item.score : 0
  }));

  const finishedAt = process.hrtime.bigint();
  const tookMs = Number(finishedAt - startedAt) / 1_000_000;

  return res.status(200).json({
    results: mappedResults,
    total: mappedResults.length,
    page,
    pageSize,
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
