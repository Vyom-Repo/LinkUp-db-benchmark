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

// Observability and Telemetry (Publicly viewable in Lab mode for professor demos)
router.get('/database/status', getDatabaseStatus);
router.get('/database/summary', getSummary);
router.get('/metrics', getMetrics);
router.get('/storage', getStorage);
router.post('/explain', explainQuery);

// Administrative Controls & Mutations
router.post('/database/switch', switchDatabase);
router.post('/index/toggle', toggleIndex);
router.post('/benchmark/run', runBenchmarkSuite);

module.exports = router;
