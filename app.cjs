const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const documentRoutes = require('./routes/documentRoutes.cjs');
const searchRoutes = require('./routes/searchRoutes.cjs');
const { notFoundMiddleware } = require('./middleware/notFound.cjs');
const { errorMiddleware } = require('./middleware/errorMiddleware.cjs');
const { responseTimeLogger } = require('./middleware/responseTimeLogger.cjs');

const app = express();

app.use(helmet());
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

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
