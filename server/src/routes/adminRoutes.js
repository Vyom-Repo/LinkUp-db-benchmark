const express = require('express');
const {
  getDatabaseStatus,
  switchDatabase,
  getSummary,
  getMetrics,
  getStorage,
  explainQuery,
  toggleIndex,
  runBenchmarkSuite,
} = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Enforce strict authentication and administrative role verification on ALL admin routes
router.use(requireAuth, requireAdmin);

router.get('/database/status', getDatabaseStatus);
router.get('/database/summary', getSummary);
router.get('/metrics', getMetrics);
router.get('/storage', getStorage);
router.post('/explain', explainQuery);
router.post('/database/switch', switchDatabase);
router.post('/index/toggle', toggleIndex);
router.post('/benchmark/run', runBenchmarkSuite);

module.exports = router;
