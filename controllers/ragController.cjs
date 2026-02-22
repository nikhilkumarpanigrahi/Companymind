const { generateEmbedding } = require('../services/embeddingService.cjs');
const { vectorSearchDocuments } = require('../services/documentService.cjs');
const { generateRAGAnswer, streamRAGAnswer } = require('../services/ragService.cjs');
const { asyncHandler } = require('../utils/asyncHandler.cjs');

// ── In-memory query log (persists until server restart) ────────────
const queryLog = [];
const MAX_LOG_SIZE = 500;

const logQuery = (type, query, tookMs) => {
  queryLog.push({ type, query, timestamp: new Date().toISOString(), tookMs });
  if (queryLog.length > MAX_LOG_SIZE) queryLog.shift();
};

const askQuestionHandler = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const startedAt = process.hrtime.bigint();

  const embedding = await generateEmbedding(question);
  const documents = await vectorSearchDocuments({ embedding, limit: 5 });
  const { answer, model, tokensUsed } = await generateRAGAnswer(question, documents);

  const finishedAt = process.hrtime.bigint();
  const tookMs = Number(finishedAt - startedAt) / 1_000_000;

  const sources = documents.map((doc) => ({
    id: doc._id?.toString(),
    title: doc.title || 'Untitled',
    snippet: (doc.content || '').slice(0, 200),
    relevanceScore: typeof doc.score === 'number' ? doc.score : 0,
  }));

  logQuery('ask', question, Number(tookMs.toFixed(2)));

  return res.status(200).json({
    success: true,
    answer,
    sources,
    meta: {
      model,
      tokensUsed,
      sourcesUsed: sources.length,
      tookMs: Number(tookMs.toFixed(2)),
    },
  });
});

/**
 * SSE streaming endpoint:  POST /ask/stream
 * Sends tokens one-by-one, then a final [DONE] event with sources + meta.
 */
const askQuestionStreamHandler = asyncHandler(async (req, res) => {
  const { question, conversationHistory } = req.body;
  const startedAt = process.hrtime.bigint();

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable Nginx buffering
  });

  const embedding = await generateEmbedding(question);
  const documents = await vectorSearchDocuments({ embedding, limit: 5 });

  // Send sources immediately so the client can render them
  const sources = documents.map((doc) => ({
    id: doc._id?.toString(),
    title: doc.title || 'Untitled',
    snippet: (doc.content || '').slice(0, 200),
    relevanceScore: typeof doc.score === 'number' ? doc.score : 0,
  }));
  res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

  // Stream the LLM answer
  const { answer, model } = await streamRAGAnswer(question, documents, res, conversationHistory || []);

  const finishedAt = process.hrtime.bigint();
  const tookMs = Number(finishedAt - startedAt) / 1_000_000;

  logQuery('ask-stream', question, Number(tookMs.toFixed(2)));

  // Final event
  res.write(`data: ${JSON.stringify({
    type: 'done',
    meta: { model, tokensUsed: 0, sourcesUsed: sources.length, tookMs: Number(tookMs.toFixed(2)) },
    fullAnswer: answer,
  })}\n\n`);

  res.end();
});

/**
 * GET /ask/analytics — return query log stats
 */
const getAnalyticsHandler = asyncHandler(async (_req, res) => {
  const totalQueries = queryLog.length;
  const askCount = queryLog.filter(q => q.type.startsWith('ask')).length;
  const searchCount = queryLog.filter(q => q.type === 'search').length;

  // Popular queries (top 10 by frequency)
  const freq = {};
  for (const entry of queryLog) {
    const key = entry.query.toLowerCase().trim();
    freq[key] = (freq[key] || 0) + 1;
  }
  const popularQueries = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Average response time
  const times = queryLog.map(q => q.tookMs).filter(Boolean);
  const avgResponseTime = times.length ? (times.reduce((a, b) => a + b, 0) / times.length) : 0;

  // Recent queries (last 20)
  const recentQueries = queryLog.slice(-20).reverse().map(q => ({
    query: q.query,
    type: q.type,
    timestamp: q.timestamp,
    tookMs: q.tookMs,
  }));

  return res.status(200).json({
    success: true,
    data: {
      totalQueries,
      askCount,
      searchCount,
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      popularQueries,
      recentQueries,
    },
  });
});

// Exported so search controller can log too
const getQueryLog = () => queryLog;

module.exports = { askQuestionHandler, askQuestionStreamHandler, getAnalyticsHandler, logQuery, getQueryLog };
