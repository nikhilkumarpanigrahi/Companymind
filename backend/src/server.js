const app = require('./app');
const { connectToDatabase } = require('./config/db');
const { env } = require('./config/env');

const startServer = async () => {
  await connectToDatabase();

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
