const { MongoClient } = require('mongodb');
const config = require('./env');

let client = null;
let db = null;

/**
 * Connect to MongoDB instance and initialize database reference
 */
const connectMongo = async () => {
  if (db) return db;

  client = new MongoClient(config.mongodb.uri, {
    maxPoolSize: config.mongodb.maxPool,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db();
  console.log('[MongoDB] Connected successfully to:', db.databaseName);
  return db;
};

/**
 * Get active MongoDB database instance
 */
const getDb = () => {
  if (!db) {
    throw new Error('[MongoDB] Database not initialized. Call connectMongo() first.');
  }
  return db;
};

/**
 * Get native MongoClient instance
 */
const getClient = () => client;

/**
 * Check MongoDB health
 */
const checkHealth = async () => {
  try {
    if (!db) {
      await connectMongo();
    }
    const start = Date.now();
    const adminDb = client.db().admin();
    const pingRes = await adminDb.ping();
    const latency = Date.now() - start;
    return {
      status: 'connected',
      latencyMs: latency,
      database: db.databaseName,
      ping: pingRes.ok === 1 ? 'ok' : 'fail',
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
    };
  }
};

/**
 * Graceful close
 */
const closeMongo = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

module.exports = {
  connectMongo,
  getDb,
  getClient,
  checkHealth,
  closeMongo,
};
