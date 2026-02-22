const { generateEmbedding } = require('../services/embeddingService.cjs');
const { vectorSearchDocuments } = require('../services/documentService.cjs');
const { generateRAGAnswer } = require('../services/ragService.cjs');
const { asyncHandler } = require('../utils/asyncHandler.cjs');

const askQuestionHandler = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const startedAt = process.hrtime.bigint();

  // Step 1: Generate embedding for the question
  const embedding = await generateEmbedding(question);

  // Step 2: Vector search for relevant documents (top 5)
  const documents = await vectorSearchDocuments({ embedding, limit: 5 });

  // Step 3: Generate AI answer using retrieved context
  const { answer, model, tokensUsed } = await generateRAGAnswer(question, documents);

  const finishedAt = process.hrtime.bigint();
  const tookMs = Number(finishedAt - startedAt) / 1_000_000;

  // Step 4: Format sources
  const sources = documents.map((doc) => ({
    id: doc._id?.toString(),
    title: doc.title || 'Untitled',
    snippet: (doc.content || '').slice(0, 200),
    relevanceScore: typeof doc.score === 'number' ? doc.score : 0,
  }));

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

module.exports = { askQuestionHandler };
