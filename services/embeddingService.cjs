const axios = require('axios');
const http = require('http');
const https = require('https');
const { env } = require('../config/env.cjs');
const { AppError } = require('../utils/AppError.cjs');

const axiosClient = axios.create({
  timeout: 15000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 })
});

// ── Node-side embedding LRU cache ───────────────────────────────
// Avoids redundant HTTP roundtrips to the Python embedding service
// for identical query strings (the same query repeated within TTL).
class EmbeddingLRU {
  constructor(maxSize = 500, ttlMs = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }
  _key(text) { return text.trim().toLowerCase(); }
  get(text) {
    const key = this._key(text);
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.ttlMs) { this.cache.delete(key); return undefined; }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }
  set(text, embedding) {
    const key = this._key(text);
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, { value: embedding, ts: Date.now() });
  }
}
const embeddingCache = new EmbeddingLRU(500, 10 * 60 * 1000);

const generateEmbedding = async (text) => {
  // Check Node-side cache first
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  const headers = {};
  if (env.EMBEDDING_API_KEY) {
    headers.Authorization = `Bearer ${env.EMBEDDING_API_KEY}`;
  }

  try {
    const response = await axiosClient.post(
      env.EMBEDDING_API_URL,
      { text },
      { headers }
    );

    const embedding =
      response.data?.embedding ||
      response.data?.vector ||
      response.data?.data?.embedding;

    if (
      !Array.isArray(embedding) ||
      embedding.length === 0 ||
      !embedding.every((value) => typeof value === 'number')
    ) {
      throw new AppError('Embedding API returned invalid embedding format', 502);
    }

    embeddingCache.set(text, embedding);
    return embedding;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const status = error.response?.status || 502;
    const message =
      error.response?.data?.message ||
      'Failed to generate embedding from Python API';

    throw new AppError(message, status);
  }
};

module.exports = { generateEmbedding };
