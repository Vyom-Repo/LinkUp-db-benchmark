const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// 1. Full Platform & Benchmark Diagnostics Telemetry
router.get('/metrics', requireAuth, requireAdmin, adminController.getMetrics);

// 2. Dynamic Runtime Database Switcher
router.post('/db-switch', requireAuth, requireAdmin, adminController.switchEngine);

// 3. Native Query Execution Plan Inspector (EXPLAIN ANALYZE / explain("executionStats"))
router.post('/explain', requireAuth, requireAdmin, adminController.explainQuery);

// 4. Scientific Empirical Benchmark Runner
router.post('/benchmark', requireAuth, requireAdmin, adminController.runBenchmark);

// 5. Benchmark Execution History
router.get('/benchmark-history', requireAuth, requireAdmin, adminController.getHistory);

// 6. Physical Storage & Index Distribution Breakdown
router.get('/storage', requireAuth, requireAdmin, adminController.getStorageAnalysis);

// 7. Empirical Index Selectivity Analysis (With Index vs Without Index)
router.get('/index-analysis', requireAuth, requireAdmin, adminController.getIndexAnalysis);

module.exports = router;
