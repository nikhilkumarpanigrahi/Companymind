/**
 * Database Seeding Script
 * 
 * Seeds MongoDB with sample documents including embeddings.
 * Run with: node seeds/seedDatabase.cjs
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Document } = require('../models/Document.cjs');
const { connectToDatabase } = require('../config/db.cjs');

// CLI arguments
const args = process.argv.slice(2);
let INPUT_FILE = path.join(__dirname, 'sample-documents.json');
let NO_WAIT = false;
for (const arg of args) {
  if (arg.startsWith('--file=')) INPUT_FILE = path.resolve(arg.split('=').slice(1).join('='));
  if (arg === '--no-wait') NO_WAIT = true;
}

// Configuration
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || 'http://localhost:8000/embed-query';
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || '';
const BATCH_SIZE = 25; // Process 25 documents at a time
const DELAY_MS = 100; // Delay between batches to avoid overwhelming the API

// Helper: Generate embedding for text
const generateEmbedding = async (text) => {
  try {
    const headers = {};
    if (EMBEDDING_API_KEY) {
      headers.Authorization = `Bearer ${EMBEDDING_API_KEY}`;
    }

    const response = await axios.post(
      EMBEDDING_API_URL,
      { text },
      { headers, timeout: 15000 }
    );

    const embedding = response.data?.embedding || response.data?.vector || response.data?.data?.embedding;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding format received');
    }

    return embedding;
  } catch (error) {
    console.error(`❌ Failed to generate embedding: ${error.message}`);
    throw error;
  }
};

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Process documents in batches
const processBatch = async (documents, startIndex) => {
  const endIndex = Math.min(startIndex + BATCH_SIZE, documents.length);
  const batch = documents.slice(startIndex, endIndex);

  console.log(`\n📦 Processing batch ${Math.floor(startIndex / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}`);
  console.log(`   Documents ${startIndex + 1}-${endIndex} of ${documents.length}`);

  const processedDocs = [];

  for (let i = 0; i < batch.length; i++) {
    const doc = batch[i];
    const docNumber = startIndex + i + 1;

    try {
      process.stdout.write(`   [${docNumber}/${documents.length}] "${doc.title.substring(0, 40)}..." `);

      // Combine title and content for better semantic representation
      const textToEmbed = `${doc.title}\n\n${doc.content}`;
      const embedding = await generateEmbedding(textToEmbed);

      processedDocs.push({
        title: doc.title,
        content: doc.content,
        embedding,
        category: doc.category,
        tags: doc.tags,
        createdAt: new Date()
      });

      process.stdout.write(`✅\n`);
    } catch (error) {
      process.stdout.write(`❌ Failed\n`);
      console.error(`   Error: ${error.message}`);
    }

    // Small delay between individual requests
    if (i < batch.length - 1) {
      await sleep(50);
    }
  }

  return processedDocs;
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding process...\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Check if embedding service is running
    console.log('🔍 Checking embedding service...');
    try {
      const healthCheck = await axios.get(
        EMBEDDING_API_URL.replace('/embed-query', '/health'),
        { timeout: 5000 }
      );
      console.log(`✅ Embedding service is running (${healthCheck.data.model_name || 'unknown model'})\n`);
    } catch (error) {
      console.error('❌ Embedding service is not accessible!');
      console.error(`   Make sure the embedding service is running at ${EMBEDDING_API_URL}`);
      console.error('   Start it with: cd embedding-service && python -m app.main\n');
      process.exit(1);
    }

    // Load sample documents
    console.log(`📖 Loading documents from ${INPUT_FILE}...`);
    const sampleDocuments = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`✅ Loaded ${sampleDocuments.length} documents\n`);

    // Check for existing documents
    const existingCount = await Document.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Database already contains ${existingCount} documents`);
      console.log('   Options:');
      console.log('   1. Skip seeding (press Ctrl+C)');
      console.log('   2. Continue anyway (will add duplicates)\n');
      
      // Wait 5 seconds before continuing (skip with --no-wait)
      if (!NO_WAIT) {
        console.log('   Continuing in 5 seconds...');
        await sleep(5000);
      } else {
        console.log('   --no-wait flag set, continuing immediately...');
      }
    }

    // Process documents in batches
    console.log('🚀 Generating embeddings and inserting documents...');
    const allProcessedDocs = [];

    for (let i = 0; i < sampleDocuments.length; i += BATCH_SIZE) {
      const batchDocs = await processBatch(sampleDocuments, i);
      allProcessedDocs.push(...batchDocs);

      // Delay between batches
      if (i + BATCH_SIZE < sampleDocuments.length) {
        await sleep(DELAY_MS);
      }
    }

    // Insert into database
    if (allProcessedDocs.length > 0) {
      console.log(`\n💾 Inserting ${allProcessedDocs.length} documents into MongoDB...`);
      const insertResult = await Document.insertMany(allProcessedDocs, { ordered: false });
      console.log(`✅ Successfully inserted ${insertResult.length} documents\n`);
    } else {
      console.log('\n❌ No documents were processed successfully\n');
      process.exit(1);
    }

    // Display statistics
    console.log('📊 Seeding Statistics:');
    console.log(`   Total documents processed: ${allProcessedDocs.length}`);
    console.log(`   Success rate: ${Math.round((allProcessedDocs.length / sampleDocuments.length) * 100)}%`);
    
    const totalDocs = await Document.countDocuments();
    console.log(`   Total documents in database: ${totalDocs}`);

    // Display category breakdown
    const categories = await Document.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📂 Documents by category:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count}`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Verify vector index is created in MongoDB Atlas');
    console.log('   2. Test search functionality: npm run dev');
    console.log('   3. Try sample queries in the UI\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

// Run seeding if executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, generateEmbedding };
