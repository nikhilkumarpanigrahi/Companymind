const mongoose = require('mongoose');
const { env } = require('./env.cjs');

const connectToDatabase = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: 30,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });

  console.log('Connected to MongoDB Atlas');
};

module.exports = { connectToDatabase };
