const { Document } = require('../models/Document');
const { env } = require('../config/env');

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
  vectorSearchDocuments
};
