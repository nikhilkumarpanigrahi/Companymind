const { Document } = require('../models/Document.cjs');
const { env } = require('../config/env.cjs');

const createDocument = async ({ title, content, embedding, category, tags }) => {
  const docData = { title, content, embedding };
  if (category) docData.category = category;
  if (tags && tags.length > 0) docData.tags = tags;
  return Document.create(docData);
};

const listDocuments = async (limit = 100) => {
  return Document.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-embedding')
    .lean();
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
  const numCandidates = Math.max(limit * 20, 200);

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

/**
 * Hybrid search: MongoDB $vectorSearch + post-hoc text-match boosting.
 * Strategy: run vector search, then boost results whose title/content
 * contain query keywords (simulating a hybrid retrieval pipeline).
 */
const hybridSearchDocuments = async ({ embedding, query, limit = 10 }) => {
  const numCandidates = Math.max(limit * 20, 200);
  const vectorResults = await Document.aggregate([
    {
      $vectorSearch: {
        index: env.VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: embedding,
        numCandidates,
        limit: limit * 3 // over-fetch for re-ranking
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        createdAt: 1,
        vectorScore: { $meta: 'vectorSearchScore' }
      }
    }
  ]);

  // Keyword-boost: check how many query tokens appear in title/content
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const reRanked = vectorResults.map((doc) => {
    const text = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
    const matchCount = tokens.filter((t) => text.includes(t)).length;
    const keywordBoost = tokens.length > 0 ? (matchCount / tokens.length) * 0.25 : 0;
    return { ...doc, score: doc.vectorScore + keywordBoost };
  });

  reRanked.sort((a, b) => b.score - a.score);
  return reRanked.slice(0, limit);
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
