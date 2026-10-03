const { MongoClient } = require('mongodb');
const config = require('./env');

let client = null;
let db = null;

async function connectMongo() {
  if (db) return db;

  client = new MongoClient(config.mongo.uri, {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  db = client.db(config.mongo.dbName);
  console.log(`[MongoDB] Connected successfully to: ${config.mongo.dbName}`);
  return db;
}

function getMongoDb() {
  if (!db) {
    throw new Error('MongoDB not initialized. Call connectMongo() first.');
  }
  return db;
}

async function testMongoConnection() {
  const database = await connectMongo();
  const pingRes = await database.command({ ping: 1 });
  return {
    connected: pingRes.ok === 1,
    database: database.databaseName,
  };
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectMongo,
  getMongoDb,
  testMongoConnection,
  closeMongo,
};
