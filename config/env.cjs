const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = ['MONGODB_URI', 'EMBEDDING_API_URL'];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.warn(`⚠️  Missing environment variable: ${variable} — some features may not work`);
  }
}

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toNumber(process.env.PORT, 5000),
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || undefined,
  EMBEDDING_API_URL: process.env.EMBEDDING_API_URL,
  EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY || '',
  VECTOR_INDEX_NAME: process.env.VECTOR_INDEX_NAME || 'documents_embedding_index',
  GROQ_API_KEY: process.env.GROQ_API_KEY || ''
};

module.exports = { env };
