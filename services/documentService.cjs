const { Document } = require('../models/Document.cjs');
const { env } = require('../config/env.cjs');

const createDocument = async ({ title, content, embedding }) => {
  return Document.create({ title, content, embedding });
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

module.exports = {
  createDocument,
  listDocuments,
  getDocumentStats,
  vectorSearchDocuments
};
