const os = require('os');
const systemState = require('../config/state');
const { checkHealth: checkPgHealth } = require('../config/postgres');
const { checkHealth: checkMongoHealth } = require('../config/mongodb');
const { userRepo, postRepo, commentRepo, likeRepo, diagnosticsRepo, postgres, mongodb } = require('../repositories');
const { tracker } = require('../middleware/timingMiddleware');

const getDatabaseStatus = async (req, res, next) => {
  try {
    const pgHealth = await checkPgHealth();
    const mongoHealth = await checkMongoHealth();

    res.json({
      success: true,
      data: {
        activeEngine: systemState.getActiveEngine(),
        switchedAt: systemState.getState().switchedAt,
        engines: {
          postgres: pgHealth,
          mongodb: mongoHealth,
        },
        switchHistory: systemState.getHistory(),
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const switchDatabase = async (req, res, next) => {
  try {
    const { engine } = req.body;
    if (!engine) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Engine name ("postgres" or "mongodb") is required.' },
      });
    }

    const switchedBy = req.user ? req.user.username : 'admin';
    const state = systemState.setActiveEngine(engine, switchedBy);

    res.json({
      success: true,
      data: {
        message: `Active database engine switched to "${state.activeEngine}".`,
        ...state,
      },
      meta: {
        engine: state.activeEngine,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const [usersCount, postsCount, commentsCount, likesCount] = await Promise.all([
      userRepo.count(),
      postRepo.count(),
      commentRepo.count(),
      likeRepo.count(),
    ]);

    res.json({
      success: true,
      data: {
        engine: systemState.getActiveEngine(),
        counts: {
          users: usersCount,
          posts: postsCount,
          comments: commentsCount,
          likes: likesCount,
        },
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMetrics = async (req, res) => {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const snapshot = tracker.getSnapshot();

  res.json({
    success: true,
    data: {
      engine: systemState.getActiveEngine(),
      telemetry: snapshot,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        cpuCores: os.cpus().length,
        freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
        totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      },
      process: {
        heapUsedMB: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotalMB: parseFloat((mem.heapTotal / (1024 * 1024)).toFixed(2)),
        rssMB: parseFloat((mem.rss / (1024 * 1024)).toFixed(2)),
        externalMB: parseFloat((mem.external / (1024 * 1024)).toFixed(2)),
        userCpuMicros: cpu.user,
        systemCpuMicros: cpu.system,
      },
    },
    meta: {
      engine: systemState.getActiveEngine(),
    },
  });
};

const getStorage = async (req, res, next) => {
  try {
    // Collect storage from active engine or both for comparison!
    const activeEngine = systemState.getActiveEngine();
    const activeStorage = await diagnosticsRepo.getStorageStats();

    // Also get secondary engine storage if available for side-by-side comparison
    let comparison = null;
    try {
      const otherRepo = activeEngine === 'postgres' ? mongodb.diagnostics : postgres.diagnostics;
      comparison = await otherRepo.getStorageStats();
    } catch (e) {
      comparison = { error: e.message };
    }

    res.json({
      success: true,
      data: {
        active: activeStorage,
        comparison,
      },
      meta: {
        engine: activeEngine,
      },
    });
  } catch (error) {
    next(error);
  }
};

const explainQuery = async (req, res, next) => {
  try {
    const { operation = 'feed', searchTerm = 'database', authorId } = req.body;
    const activeEngine = systemState.getActiveEngine();

    let result;
    if (activeEngine === 'postgres') {
      if (operation === 'feed') {
        const sql = `
          SELECT p.*, u.name as author_name, u.username as author_username
          FROM posts p
          JOIN users u ON p.author_id = u.id
          ORDER BY p.created_at DESC
          LIMIT 20;
        `;
        result = await postgres.diagnostics.explainQuery(sql);
      } else if (operation === 'search') {
        const sql = `
          SELECT p.*, u.name as author_name, u.username as author_username
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.search_vector @@ plainto_tsquery('english', $1)
          ORDER BY p.created_at DESC
          LIMIT 20;
        `;
        result = await postgres.diagnostics.explainQuery(sql, [searchTerm]);
      } else if (operation === 'top_engaged') {
        const sql = `
          SELECT p.id, p.content, p.like_count, p.comment_count
          FROM posts p
          ORDER BY (p.like_count + p.comment_count) DESC
          LIMIT 5;
        `;
        result = await postgres.diagnostics.explainQuery(sql);
      } else {
        return res.status(400).json({ success: false, error: { message: `Unknown operation: ${operation}` } });
      }
    } else {
      // MongoDB
      if (operation === 'feed') {
        result = await mongodb.diagnostics.explainQuery({
          collectionName: 'posts',
          filter: {},
          sort: { createdAt: -1 },
          limit: 20,
        });
      } else if (operation === 'search') {
        result = await mongodb.diagnostics.explainQuery({
          collectionName: 'posts',
          filter: { $text: { $search: searchTerm } },
          sort: { createdAt: -1 },
          limit: 20,
        });
      } else if (operation === 'top_engaged') {
        result = await mongodb.diagnostics.explainQuery({
          collectionName: 'posts',
          filter: {},
          sort: { likeCount: -1 },
          limit: 5,
        });
      } else {
        return res.status(400).json({ success: false, error: { message: `Unknown operation: ${operation}` } });
      }
    }

    res.json({
      success: true,
      data: {
        operation,
        ...result,
      },
      meta: {
        engine: activeEngine,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleIndex = async (req, res, next) => {
  try {
    const { target = 'posts_author', state = 'disable' } = req.body;
    const activeEngine = systemState.getActiveEngine();

    const result = await diagnosticsRepo.toggleIndex({ target, state });

    res.json({
      success: true,
      data: {
        engine: activeEngine,
        target,
        requestedState: state,
        result,
      },
      meta: {
        engine: activeEngine,
      },
    });
  } catch (error) {
    next(error);
  }
};

const runBenchmarkSuite = async (req, res, next) => {
  try {
    const { experiment = 'feed_read', iterations = 50, warmupCount = 3 } = req.body;
    const { runBenchmark } = require('../benchmark/benchmarkRunner');

    const benchmarkResult = await runBenchmark({
      experiment,
      iterations: Math.min(500, Math.max(5, parseInt(iterations, 10) || 50)),
      warmupCount: Math.min(10, Math.max(0, parseInt(warmupCount, 10) || 3)),
    });

    res.json({
      success: true,
      data: benchmarkResult,
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDatabaseStatus,
  switchDatabase,
  getSummary,
  getMetrics,
  getStorage,
  explainQuery,
  toggleIndex,
  runBenchmarkSuite,
};
