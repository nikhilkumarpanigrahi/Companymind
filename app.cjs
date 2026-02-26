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

// ── Health Check ────────────────────────────────────────────
// Always return 200 so Render's health check passes even while DB is connecting.
// The response body still reports true database status for monitoring.
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.status(200).json({
      success: true,
      message: dbHealth.status === 'healthy' ? 'Service is healthy' : 'Service running, database degraded',
      database: dbHealth,
    });
  } catch {
    res.status(200).json({
      success: true,
      message: 'Service running, database health check failed',
    });
  }
});

app.use('/api/documents', documentRoutes);
app.use('/api/search', searchLimiter, searchRoutes);
app.use('/api/ask', searchLimiter, askRoutes);
app.use('/api/benchmark', benchmarkRoutes);

// ── Serve React frontend in production ──────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for any non-API route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use(notFoundMiddleware);
}

// Error handler (must be last middleware)
app.use(errorMiddleware);

module.exports = app;
