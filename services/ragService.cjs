const axios = require('axios');
const { env } = require('../config/env.cjs');
const { AppError } = require('../utils/AppError.cjs');

const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SYSTEM_PROMPT = `You are CompanyMind AI — an intelligent knowledge assistant for enterprise teams.
You answer questions using ONLY the provided context documents. Follow these rules strictly:

1. Base your answer EXCLUSIVELY on the provided context. Do not use outside knowledge.
2. If the context doesn't contain enough information, say so honestly.
3. Be concise, clear, and professional. Use bullet points and headers when helpful.
4. When referencing information, mention which source document it came from using [Source: title].
5. Format your response in clean Markdown.
6. If the question is a greeting or casual chat, respond naturally but briefly.`;

const buildContextPrompt = (question, documents) => {
  const contextParts = documents.map((doc, i) => {
    const content = doc.content || '';
    const truncated = content.length > 1500 ? content.slice(0, 1500) + '...' : content;
    return `--- Source ${i + 1}: "${doc.title}" (relevance: ${(doc.score || 0).toFixed(3)}) ---\n${truncated}`;
  });

  return `CONTEXT DOCUMENTS:\n${contextParts.join('\n\n')}\n\n---\n\nUSER QUESTION: ${question}\n\nProvide a comprehensive answer based on the context above. Cite sources using [Source: title].`;
};

const generateRAGAnswer = async (question, documents) => {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError('GROQ_API_KEY is not configured. Add it to your .env file.', 500);
  }

  const userPrompt = buildContextPrompt(question, documents);

  try {
    const response = await groqClient.post(
      '/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (!answer) {
      throw new AppError('LLM returned an empty response', 502);
    }

    return {
      answer,
      model: response.data?.model || 'llama-3.3-70b-versatile',
      tokensUsed: response.data?.usage?.total_tokens || 0,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    const status = error.response?.status || 502;
    const message = error.response?.data?.error?.message || 'Failed to generate AI answer';
    throw new AppError(message, status);
  }
};

module.exports = { generateRAGAnswer };
