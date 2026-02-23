const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const documentRoutes = require('./routes/documentRoutes.cjs');
const searchRoutes = require('./routes/searchRoutes.cjs');
const askRoutes = require('./routes/askRoutes.cjs');
const benchmarkRoutes = require('./routes/benchmarkRoutes.cjs');
const { notFoundMiddleware } = require('./middleware/notFound.cjs');
const { errorMiddleware } = require('./middleware/errorMiddleware.cjs');
const { responseTimeLogger } = require('./middleware/responseTimeLogger.cjs');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(responseTimeLogger);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy'
  });
});

app.use('/documents', documentRoutes);
app.use('/search', searchRoutes);
app.use('/ask', askRoutes);
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
