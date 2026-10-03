const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { testPostgresConnection } = require('./config/postgres');
const { connectMongo, testMongoConnection } = require('./config/mongodb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

// Global Engine State
let activeEngine = config.defaultDb; // 'POSTGRES' | 'MONGODB'

// 1. Basic Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    activeEngine,
    timestamp: new Date().toISOString(),
  });
});

// 2. Database Status (Dual Engine Diagnostics)
app.get('/api/db-status', async (req, res) => {
  const status = {
    activeEngine,
    postgres: { connected: false, latencyMs: null, database: null, error: null },
    mongodb: { connected: false, latencyMs: null, database: null, error: null },
  };

  // Check PostgreSQL
  try {
    const t0 = process.hrtime.bigint();
    const pgRes = await testPostgresConnection();
    const t1 = process.hrtime.bigint();
    status.postgres = {
      connected: pgRes.connected,
      latencyMs: Number(t1 - t0) / 1e6,
      database: pgRes.database,
      error: null,
    };
  } catch (err) {
    status.postgres.error = err.message;
  }

  // Check MongoDB
  try {
    const t0 = process.hrtime.bigint();
    const mRes = await testMongoConnection();
    const t1 = process.hrtime.bigint();
    status.mongodb = {
      connected: mRes.connected,
      latencyMs: Number(t1 - t0) / 1e6,
      database: mRes.database,
      error: null,
    };
  } catch (err) {
    status.mongodb.error = err.message;
  }

  res.json({ success: true, data: status });
});

// 3. Switch Active Engine on the fly
app.post('/api/db-switch', (req, res) => {
  const { engine } = req.body;
  if (!['POSTGRES', 'MONGODB'].includes(engine?.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid database engine. Choose either POSTGRES or MONGODB.',
    });
  }

  activeEngine = engine.toUpperCase();
  console.log(`[Engine Switcher] Active database dynamically set to: ${activeEngine}`);
  res.json({ success: true, activeEngine });
});

// Server Starter
async function startServer() {
  try {
    console.log('[Startup] Connecting to data stores...');
    await testPostgresConnection();
    console.log('[Startup] ✅ PostgreSQL connected.');
    await connectMongo();
    console.log('[Startup] ✅ MongoDB connected.');

    const server = app.listen(config.port, () => {
      console.log('======================================================');
      console.log(`🚀 Sync Backend Server running on http://localhost:${config.port}`);
      console.log(`📡 Active Database Engine: ${activeEngine}`);
      console.log(`📊 Health Endpoint:         http://localhost:${config.port}/api/health`);
      console.log(`🔬 DB Status Endpoint:      http://localhost:${config.port}/api/db-status`);
      console.log('======================================================');
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
