const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const documentRoutes = require('./routes/documentRoutes.cjs');
const searchRoutes = require('./routes/searchRoutes.cjs');
const askRoutes = require('./routes/askRoutes.cjs');
const benchmarkRoutes = require('./routes/benchmarkRoutes.cjs');
const { notFoundMiddleware } = require('./middleware/notFound.cjs');
const { errorMiddleware } = require('./middleware/errorMiddleware.cjs');
const { responseTimeLogger } = require('./middleware/responseTimeLogger.cjs');
const { checkDatabaseHealth } = require('./config/db.cjs');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
}));
app.use(cors());
app.use(compression()); // gzip responses
app.use(express.json({ limit: '1mb' }));
app.use(responseTimeLogger);

// ── Rate Limiting ───────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,                 // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,                  // 30 search/ask requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many search requests, please slow down.' },
});

app.use(generalLimiter);

// ── Health Check (wired to actual DB health) ───────────────────
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const isHealthy = dbHealth.status === 'healthy';
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy ? 'Service is healthy' : 'Service degraded',
      database: dbHealth,
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
    });
  }
});

app.use('/documents', documentRoutes);
app.use('/search', searchLimiter, searchRoutes);
app.use('/ask', searchLimiter, askRoutes);
app.use('/benchmark', benchmarkRoutes);

// ── Serve React frontend in production ──────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use(notFoundMiddleware);
}

app.use(errorMiddleware);

module.exports = app;
