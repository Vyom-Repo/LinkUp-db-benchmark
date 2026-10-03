const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');
const { getActiveEngine, setActiveEngine } = require('../config/engineState');

// 1. GET FULL PLATFORM & BENCHMARK METRICS (Protected: Admin Only)
router.get('/metrics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const activeEngine = getActiveEngine();

    // PostgreSQL Telemetry
    let pgStats = { users: 0, posts: 0, comments: 0, likes: 0, dbSize: 'N/A' };
    try {
      const counts = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM posts) as posts,
          (SELECT COUNT(*) FROM comments) as comments,
          (SELECT COUNT(*) FROM post_likes) as likes;
      `);
      const sizeRes = await query(`SELECT pg_size_pretty(pg_database_size('sync_db')) as db_size;`);
      if (counts.rows[0]) {
        pgStats = {
          users: parseInt(counts.rows[0].users, 10),
          posts: parseInt(counts.rows[0].posts, 10),
          comments: parseInt(counts.rows[0].comments, 10),
          likes: parseInt(counts.rows[0].likes, 10),
          dbSize: sizeRes.rows[0]?.db_size || 'N/A',
        };
      }
    } catch (err) {
      console.error('[Admin Metrics PG Error]:', err.message);
    }

    // MongoDB Telemetry
    let mongoStats = { users: 0, posts: 0, comments: 0, likes: 0, dataSize: 'N/A', storageSize: 'N/A' };
    try {
      const mongoDb = getMongoDb();
      const [users, posts, comments, likes] = await Promise.all([
        mongoDb.collection('users').estimatedDocumentCount(),
        mongoDb.collection('posts').estimatedDocumentCount(),
        mongoDb.collection('comments').estimatedDocumentCount(),
        mongoDb.collection('post_likes').estimatedDocumentCount(),
      ]);

      const dbStats = await mongoDb.command({ dbStats: 1 });
      const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

      mongoStats = {
        users,
        posts,
        comments,
        likes,
        dataSize: formatMB(dbStats.dataSize || 0),
        storageSize: formatMB(dbStats.storageSize || 0),
      };
    } catch (err) {
      console.error('[Admin Metrics Mongo Error]:', err.message);
    }

    return res.json({
      success: true,
      data: {
        activeEngine,
        postgres: pgStats,
        mongodb: mongoStats,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin Metrics Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to retrieve admin metrics.' } });
  }
});

// 2. TOGGLE DATABASE ENGINE (Protected: Admin Only)
router.post('/db-switch', requireAuth, requireAdmin, (req, res) => {
  const { engine } = req.body;
  if (!['POSTGRES', 'MONGODB'].includes(engine?.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid database engine. Choose either POSTGRES or MONGODB.',
    });
  }

  const newEngine = setActiveEngine(engine.toUpperCase());
  console.log(`[Admin Portal] Engine switched to: ${newEngine}`);
  return res.json({ success: true, activeEngine: newEngine });
});

module.exports = router;
