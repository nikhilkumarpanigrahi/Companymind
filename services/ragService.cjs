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
6. If the question is a greeting or casual chat, respond naturally but briefly.
7. If there is conversation history, use it to understand follow-up questions in context.`;

const buildContextPrompt = (question, documents, conversationHistory = []) => {
  const contextParts = documents.map((doc, i) => {
    const content = doc.content || '';
    const truncated = content.length > 1500 ? content.slice(0, 1500) + '...' : content;
    return `--- Source ${i + 1}: "${doc.title}" (relevance: ${(doc.score || 0).toFixed(3)}) ---\n${truncated}`;
  });

  let historyText = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6); // last 3 Q&A pairs
    historyText = '\nCONVERSATION HISTORY:\n' + recentHistory.map(m =>
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`
    ).join('\n') + '\n';
  }

  return `CONTEXT DOCUMENTS:\n${contextParts.join('\n\n')}\n${historyText}\n---\n\nUSER QUESTION: ${question}\n\nProvide a comprehensive answer based on the context above. Cite sources using [Source: title].`;
};

const extractAxiosErrorMessage = async (error) => {
  if (error instanceof AppError) return error.message;
  if (!error.response) return error.message || 'Network error contacting AI service';

  if (error.response.data && typeof error.response.data.on === 'function') {
    try {
      const raw = await new Promise((resolve) => {
        let text = '';
        error.response.data.on('data', (c) => { text += c; });
        error.response.data.on('end', () => resolve(text));
        error.response.data.on('error', () => resolve(text));
      });
      const parsed = JSON.parse(raw);
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      // ignore JSON parse errors
    }
  } else if (error.response.data?.error?.message) {
    return error.response.data.error.message;
  }

  return error.message || `AI service returned error ${error.response.status}`;
};

const getCandidateModels = () => {
  const configured = env.GROQ_MODEL;
  const candidates = [
    configured,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
  ].filter(Boolean);
  return [...new Set(candidates)];
};

const generateRAGAnswer = async (question, documents) => {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError('GROQ_API_KEY is not configured. Add it to your .env file.', 500);
  }

  const userPrompt = buildContextPrompt(question, documents);
  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    try {
      const payload = {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false,
      };

      if (model.includes('gpt-oss') || model.includes('qwen')) {
        payload.reasoning_format = 'hidden';
      }

      const response = await groqClient.post('/chat/completions', payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const answer = response.data?.choices?.[0]?.message?.content;
      if (!answer) {
        throw new AppError('LLM returned an empty response', 502);
      }

      return {
        answer,
        model: response.data?.model || model,
        tokensUsed: response.data?.usage?.total_tokens || 0,
      };
    } catch (error) {
      const status = error.response?.status;
      const message = await extractAxiosErrorMessage(error);
      lastError = new AppError(message, status || 502);

      // If the model does not exist or user lacks access (404), or model rejected (400), try fallback
      if (status === 404 || (status === 400 && message.toLowerCase().includes('model'))) {
        console.warn(`[RAG] Model "${model}" failed (${message}). Trying next fallback model...`);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new AppError('Failed to generate AI answer with any available model', 502);
};

/**
 * Stream RAG answer via SSE. Calls Groq with stream: true
 * and pipes chunks to the Express response.
 */
const streamRAGAnswer = async (question, documents, res, conversationHistory = []) => {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError('GROQ_API_KEY is not configured. Add it to your .env file.', 500);
  }

  const userPrompt = buildContextPrompt(question, documents, conversationHistory);
  const models = getCandidateModels();
  let response = null;
  let activeModel = models[0];

  for (const model of models) {
    try {
      const payload = {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9,
        stream: true,
      };

      if (model.includes('gpt-oss') || model.includes('qwen')) {
        payload.reasoning_format = 'hidden';
      }

      response = await groqClient.post('/chat/completions', payload, {
        headers: { Authorization: `Bearer ${apiKey}` },
        responseType: 'stream',
      });

      activeModel = model;
      break;
    } catch (error) {
      const status = error.response?.status;
      const message = await extractAxiosErrorMessage(error);

      if (status === 404 || (status === 400 && message.toLowerCase().includes('model'))) {
        console.warn(`[RAG Stream] Model "${model}" failed (${message}). Trying next fallback model...`);
        continue;
      }
      throw new AppError(message, status || 502);
    }
  }

  if (!response) {
    throw new AppError('Failed to initialize AI stream with any available model', 502);
  }

  let fullAnswer = '';
  let model = activeModel;

  return new Promise((resolve, reject) => {
    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            fullAnswer += delta.content;
            res.write(`data: ${JSON.stringify({ type: 'token', content: delta.content })}\n\n`);
          }
          if (parsed.model) model = parsed.model;
        } catch {
          // skip malformed chunks
        }
      }
    });

    response.data.on('end', () => {
      resolve({ answer: fullAnswer, model, tokensUsed: 0 });
    });

    response.data.on('error', (err) => {
      reject(new AppError(err.message || 'Streaming failed', 502));
    });
  });
};

module.exports = { generateRAGAnswer, streamRAGAnswer };
