const { Document } = require('../models/Document.cjs');
const { env } = require('../config/env.cjs');

// ── In-memory LRU cache for search results ──────────────────────
class LRUCache {
  constructor(maxSize = 200, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.ttlMs) { this.cache.delete(key); return undefined; }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, { value, ts: Date.now() });
  }
}
const searchCache = new LRUCache(200, 5 * 60 * 1000); // 5 min TTL

/** Build a cache key from query + limit */
const cacheKey = (prefix, query, limit) => `${prefix}:${query.trim().toLowerCase()}:${limit}`;

const createDocument = async ({ title, content, embedding, category, tags }) => {
  const docData = { title, content, embedding };
  if (category) docData.category = category;
  if (tags && tags.length > 0) docData.tags = tags;
  return Document.create(docData);
};

const listDocuments = async ({ page = 1, pageSize = 30, search = '', category = '' } = {}) => {
  const filter = {};
  if (category && category !== 'all') {
    filter.category = category;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { content: regex }];
  }

  const [docs, total, categories] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select('-embedding')
      .lean(),
    Document.countDocuments(filter),
    Document.distinct('category'),
  ]);

  return { docs, total, categories: categories.filter(Boolean).sort() };
};

const getDocumentStats = async () => {
  const totalDocs = await Document.countDocuments();

  const categoryAgg = await Document.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const tagAgg = await Document.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  const recentDocs = await Document.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title category createdAt')
    .lean();

  return {
    totalDocuments: totalDocs,
    categories: categoryAgg.map(c => ({ name: c._id || 'uncategorized', count: c.count })),
    topTags: tagAgg.map(t => ({ name: t._id, count: t.count })),
    recentDocuments: recentDocs,
  };
};

const vectorSearchDocuments = async ({ embedding, limit = 10 }) => {
  const numCandidates = Math.max(limit * 10, 200);

  return Document.aggregate([
    {
      $vectorSearch: {
        index: env.VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: embedding,
        numCandidates,
        limit
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        createdAt: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]);
};

/**
 * MongoDB $text (keyword) search — uses the built-in text index.
 * Returns results sorted by MongoDB textScore.
 */
const textSearchDocuments = async ({ query, limit = 10 }) => {
  return Document.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' }, title: 1, content: 1, createdAt: 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
};

/**
 * Regex-based search (fallback / baseline).
 * Case-insensitive regex across title + content.
 */
const regexSearchDocuments = async ({ query, limit = 10 }) => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  return Document.find({ $or: [{ title: regex }, { content: regex }] })
    .limit(limit)
    .select('title content createdAt')
    .lean()
    .then((docs) =>
      docs.map((d) => ({ ...d, score: 0.5 })) // flat score for baseline
    );
};

/** Minimum relevance score — results below this are discarded */
const MIN_SCORE_THRESHOLD = 0.35;

/**
 * Reciprocal Rank Fusion (RRF) — merges two ranked lists by position.
 * score = sum( 1 / (k + rank_i) ) for each list the doc appears in.
 * Parameter k = 60 is the standard constant from the RRF paper.
 */
const RRF_K = 60;

const reciprocalRankFusion = (vectorResults, textResults, limit) => {
  const scoreMap = new Map(); // docId -> { doc, rrfScore, vectorScore }

  vectorResults.forEach((doc, idx) => {
    const id = doc._id?.toString();
    const rrfScore = 1 / (RRF_K + idx + 1);
    scoreMap.set(id, { doc, rrfScore, vectorScore: doc.vectorScore ?? 0 });
  });

  textResults.forEach((doc, idx) => {
    const id = doc._id?.toString();
    const rrfScore = 1 / (RRF_K + idx + 1);
    if (scoreMap.has(id)) {
      scoreMap.get(id).rrfScore += rrfScore;
    } else {
      scoreMap.set(id, { doc, rrfScore });
    }
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, limit)
    .map(({ doc, rrfScore, vectorScore }) => ({ ...doc, score: rrfScore, vectorScore }));
};

/**
 * Hybrid search: Reciprocal Rank Fusion (RRF) of
 *   1) MongoDB $vectorSearch (semantic)
 *   2) MongoDB $text search (keyword / BM25-style)
 * Both result sets are merged using RRF for robust, parameter-free ranking.
 */
const hybridSearchDocuments = async ({ embedding, query, limit = 10 }) => {
  // Check cache first
  const ck = cacheKey('hybrid', query, limit);
  const cached = searchCache.get(ck);
  if (cached) return cached;

  const overFetchLimit = Math.max(limit * 3, 30);

  // Tune numCandidates: 5x overFetch with a reasonable ceiling
  const numCandidates = Math.min(Math.max(overFetchLimit * 5, 100), 500);

  // Run vector search and text search in parallel
  const [vectorResults, textResults] = await Promise.all([
    Document.aggregate([
      {
        $vectorSearch: {
          index: env.VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: embedding,
          numCandidates,
          limit: overFetchLimit
        }
      },
      {
        $project: {
          title: 1,
          content: 1,
          category: 1,
          tags: 1,
          createdAt: 1,
          vectorScore: { $meta: 'vectorSearchScore' }
        }
      }
    ]),
    // Text search (BM25-style keyword matching)
    Document.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' }, title: 1, content: 1, category: 1, tags: 1, createdAt: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(overFetchLimit)
      .lean()
      .catch(() => []) // graceful fallback if text index missing
  ]);

  // Merge with RRF
  let merged = reciprocalRankFusion(vectorResults, textResults, limit);

  // Apply minimum score threshold
  // For RRF the max single-source score is 1/(60+1) ≈ 0.016, so threshold on percentile
  // Filter out docs that only appeared in one list with rank > threshold position
  // We keep results where rrfScore > 1/(RRF_K + limit * 3) as a reasonable cutoff
  const rrfThreshold = 1 / (RRF_K + limit * 3);
  merged = merged.filter(doc => doc.score >= rrfThreshold);

  searchCache.set(ck, merged);
  return merged;
};

module.exports = {
  createDocument,
  listDocuments,
  getDocumentStats,
  vectorSearchDocuments,
  textSearchDocuments,
  regexSearchDocuments,
  hybridSearchDocuments
};
