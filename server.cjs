const app = require('./app.cjs');
const { connectToDatabase } = require('./config/db.cjs');
const { env } = require('./config/env.cjs');

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
