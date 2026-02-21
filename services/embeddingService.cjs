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

const generateEmbedding = async (text) => {
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
