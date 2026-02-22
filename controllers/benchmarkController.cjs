const { generateEmbedding } = require('../services/embeddingService.cjs');
const {
  vectorSearchDocuments,
  textSearchDocuments,
  regexSearchDocuments,
  hybridSearchDocuments
} = require('../services/documentService.cjs');
const { asyncHandler } = require('../utils/asyncHandler.cjs');

/**
 * POST /benchmark
 * Runs the same query through 4 search strategies and returns
 * latency, result quality, and overlap statistics.
 * 
 * Body: { query: string, limit?: number }
 */
const runBenchmarkHandler = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.body;
  const results = {};

  // 1 — Regex search (baseline)
  const regexStart = process.hrtime.bigint();
  let regexResults = [];
  try {
    regexResults = await regexSearchDocuments({ query, limit });
  } catch { /* skip if fails */ }
  const regexMs = Number(process.hrtime.bigint() - regexStart) / 1_000_000;
  results.regex = {
    method: 'Regex ($regex)',
    description: 'Case-insensitive regex scan across title + content. O(n) full collection scan.',
    mongoFeature: '$regex operator',
    results: regexResults.map(formatResult),
    count: regexResults.length,
    latencyMs: Number(regexMs.toFixed(2)),
  };

  // 2 — Text search (MongoDB $text)
  const textStart = process.hrtime.bigint();
  let textResults = [];
  try {
    textResults = await textSearchDocuments({ query, limit });
  } catch { /* skip if no text index */ }
  const textMs = Number(process.hrtime.bigint() - textStart) / 1_000_000;
  results.text = {
    method: 'Full-Text ($text)',
    description: 'MongoDB built-in text index with stemming, stop-word removal, and textScore ranking.',
    mongoFeature: '$text index + $meta textScore',
    results: textResults.map(formatResult),
    count: textResults.length,
    latencyMs: Number(textMs.toFixed(2)),
  };

  // 3 — Vector search (semantic)
  const embedStart = process.hrtime.bigint();
  const embedding = await generateEmbedding(query);
  const embedMs = Number(process.hrtime.bigint() - embedStart) / 1_000_000;

  const vectorStart = process.hrtime.bigint();
  const vectorResults = await vectorSearchDocuments({ embedding, limit });
  const vectorMs = Number(process.hrtime.bigint() - vectorStart) / 1_000_000;
  results.vector = {
    method: 'Vector Search ($vectorSearch)',
    description: 'MongoDB Atlas Vector Search using cosine similarity on 384-dim embeddings (all-MiniLM-L6-v2).',
    mongoFeature: '$vectorSearch aggregation stage',
    results: vectorResults.map(formatResult),
    count: vectorResults.length,
    latencyMs: Number(vectorMs.toFixed(2)),
    embeddingLatencyMs: Number(embedMs.toFixed(2)),
  };

  // 4 — Hybrid search (vector + keyword boost)
  const hybridStart = process.hrtime.bigint();
  const hybridResults = await hybridSearchDocuments({ embedding, query, limit });
  const hybridMs = Number(process.hrtime.bigint() - hybridStart) / 1_000_000;
  results.hybrid = {
    method: 'Hybrid (Vector + Keyword Boost)',
    description: 'Vector search results re-ranked with keyword-match boosting. Combines semantic understanding with exact term matching.',
    mongoFeature: '$vectorSearch + application-level re-ranking',
    results: hybridResults.map(formatResult),
    count: hybridResults.length,
    latencyMs: Number(hybridMs.toFixed(2)),
  };

  // Compute overlap matrix between methods
  const methodNames = ['regex', 'text', 'vector', 'hybrid'];
  const overlap = {};
  for (const a of methodNames) {
    overlap[a] = {};
    const setA = new Set(results[a].results.map((r) => r.id));
    for (const b of methodNames) {
      const setB = new Set(results[b].results.map((r) => r.id));
      const intersection = [...setA].filter((id) => setB.has(id)).length;
      overlap[a][b] = { count: intersection, pct: setA.size ? Number(((intersection / setA.size) * 100).toFixed(1)) : 0 };
    }
  }

  // Summary
  const summary = {
    query,
    limit,
    totalEmbeddingMs: Number(embedMs.toFixed(2)),
    methods: methodNames.map((m) => ({
      key: m,
      method: results[m].method,
      latencyMs: results[m].latencyMs,
      resultCount: results[m].count,
      avgScore: results[m].results.length
        ? Number((results[m].results.reduce((s, r) => s + r.score, 0) / results[m].results.length).toFixed(4))
        : 0,
    })),
    overlap,
  };

  return res.status(200).json({
    success: true,
    summary,
    methods: results,
  });
});

function formatResult(doc) {
  return {
    id: (doc._id || doc.id || '').toString(),
    title: doc.title || 'Untitled',
    snippet: (doc.content || '').slice(0, 200),
    score: typeof doc.score === 'number' ? Number(doc.score.toFixed(4)) : 0,
  };
}

module.exports = { runBenchmarkHandler };
