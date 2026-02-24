const app = require('./app.cjs');
const { connectToDatabase } = require('./config/db.cjs');
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
