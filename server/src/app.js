const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { pool } = require('./config/postgres');
const { connectMongo } = require('./config/mongodb');
const { timingMiddleware } = require('./middleware/timingMiddleware');
const { errorHandler } = require('./middleware/errorMiddleware');
const routes = require('./routes');
const systemState = require('./config/state');

const app = express();

// Standard Middlewares
app.use(cors({
  origin: '*',
  exposedHeaders: ['X-Database-Engine', 'X-Response-Time-Ms'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom High-Resolution Performance & Engine Observability Middleware
app.use(timingMiddleware);

// Mount API routes
app.use('/api', routes);

// Centralized Error Boundary
app.use(errorHandler);

// Server Lifecycle Startup
const startServer = async () => {
  try {
    console.log('\n[Startup] Connecting to data stores...');

    // 1. Verify PostgreSQL
    const pgRes = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    console.log(`[PostgreSQL] Connected to "${pgRes.rows[0].db_name}" at ${pgRes.rows[0].current_time}`);

    // 2. Connect to MongoDB
    await connectMongo();

    // 3. Start listening
    const server = app.listen(config.port, () => {
      console.log('\n======================================================');
      console.log(`🚀 Sync Backend Server running on port ${config.port}`);
      console.log(`📡 Default Database Engine: ${systemState.getActiveEngine().toUpperCase()}`);
      console.log(`📊 Health Endpoint:         http://localhost:${config.port}/api/health`);
      console.log(`🔬 Admin Lab Status:        http://localhost:${config.port}/api/admin/database/status`);
      console.log('======================================================\n');
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n[Shutdown] Closing HTTP server and database connections...');
      server.close(async () => {
        await pool.end();
        const { closeMongo } = require('./config/mongodb');
        await closeMongo();
        console.log('[Shutdown] Connections closed cleanly. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
