const app = require('./app.cjs');
const { connectToDatabase, closeDatabaseConnection } = require('./config/db.cjs');
const { env } = require('./config/env.cjs');

const PORT = env.PORT || 8080;

// Start listening IMMEDIATELY so Render's health check doesn't time out.
// Database connection happens in the background.
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Connect to MongoDB in the background — the /health endpoint
// will report "connecting" until the database is ready.
connectToDatabase()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => {
    console.error('Failed to connect to database:', error.message);
    // Don't exit — the server stays up so health checks can report degraded status
  });

const shutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  const forceTimer = setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await closeDatabaseConnection();
      console.log('Shutdown completed cleanly');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database connection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
