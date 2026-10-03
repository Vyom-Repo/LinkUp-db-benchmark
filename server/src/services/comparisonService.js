const { performance } = require('perf_hooks');
const { connectMongo } = require('../config/mongodb');
const postRepo = require('../repositories/postRepository');

// Cache latest comparison result in memory so dashboard shows it on load
let latestComparison = null;

/**
 * Measure full application-level response time for an identical operation on a specific engine
 * START TIMER -> Repository call -> Transformation / JSON serialization -> STOP TIMER
 */
async function measureApplicationOperation(engine, operation = 'feed_read') {
  const t0 = performance.now();
  let dbExecutionMs = 0;

  if (operation === 'feed_read') {
    const limit = 30;
    const page = 1;
    const offset = 0;
    const sort = 'latest';
    const q = '';
    const seed = 'comparison_seed_controlled';

    // Application controller / repository boundary
    const result = await postRepo.getFeed({
      currentUserId: null,
      limit,
      page,
      offset,
      sort,
      q,
      seed,
      engineOverride: engine
    });
    dbExecutionMs = result.dbExecutionMs || 0;

    // Full application response preparation and JSON serialization
    const responsePayload = {
      success: true,
      data: {
        posts: result.posts,
        page,
        limit,
        hasMore: (result.posts || []).length === limit,
        engine,
        dbExecutionMs
      }
    };
    JSON.stringify(responsePayload);
  }

  const t1 = performance.now();
  const appResponseMs = parseFloat((t1 - t0).toFixed(2));
  return { appResponseMs, dbExecutionMs };
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

function calculateP95(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Executes a controlled, fair application-level comparison between PostgreSQL and MongoDB
 * - 2 warmup executions per engine (unrecorded)
 * - 5 sample executions per engine with alternating order
 * - Median / P50 aggregation
 * - Both End-to-End Application Response Time and raw DB Execution Time recorded separately
 */
async function runControlledComparison(operation = 'feed_read') {
  // Ensure Mongo connection pool is established
  try {
    await connectMongo();
  } catch (err) {
    console.error('[Comparison Connect Error]:', err.message);
  }

  // 1. Warm-up runs (unrecorded, 2 per engine) to ensure query planner / buffer cache fairness
  try {
    await measureApplicationOperation('POSTGRES', operation);
    await measureApplicationOperation('MONGODB', operation);
    await measureApplicationOperation('POSTGRES', operation);
    await measureApplicationOperation('MONGODB', operation);
  } catch (warmupErr) {
    console.warn('[Comparison Warmup Warning]:', warmupErr.message);
  }

  // 2. Controlled sample collection (5 alternating runs)
  const samplesCount = 5;
  const pgAppSamples = [];
  const pgDbSamples = [];
  const mongoAppSamples = [];
  const mongoDbSamples = [];

  for (let i = 0; i < samplesCount; i++) {
    // Alternating execution order to eliminate any sequential bias
    if (i % 2 === 0) {
      const pgRes = await measureApplicationOperation('POSTGRES', operation);
      pgAppSamples.push(pgRes.appResponseMs);
      pgDbSamples.push(pgRes.dbExecutionMs);

      const mongoRes = await measureApplicationOperation('MONGODB', operation);
      mongoAppSamples.push(mongoRes.appResponseMs);
      mongoDbSamples.push(mongoRes.dbExecutionMs);
    } else {
      const mongoRes = await measureApplicationOperation('MONGODB', operation);
      mongoAppSamples.push(mongoRes.appResponseMs);
      mongoDbSamples.push(mongoRes.dbExecutionMs);

      const pgRes = await measureApplicationOperation('POSTGRES', operation);
      pgAppSamples.push(pgRes.appResponseMs);
      pgDbSamples.push(pgRes.dbExecutionMs);
    }
  }

  const pgMedianApp = calculateMedian(pgAppSamples);
  const pgMedianDb = calculateMedian(pgDbSamples);
  const mongoMedianApp = calculateMedian(mongoAppSamples);
  const mongoMedianDb = calculateMedian(mongoDbSamples);

  // Dynamic percentage calculation based on the slower engine
  const maxMs = Math.max(pgMedianApp, mongoMedianApp);
  const minMs = Math.min(pgMedianApp, mongoMedianApp);
  const diffMs = Math.abs(pgMedianApp - mongoMedianApp);
  const diffPct = maxMs > 0 ? parseFloat(((diffMs / maxMs) * 100).toFixed(1)) : 0;

  const isEquivalent = diffPct < 3.0; // Within 3% threshold
  const fasterEngine = mongoMedianApp < pgMedianApp ? 'MongoDB' : 'PostgreSQL';

  const result = {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    operation,
    operationLabel: 'Feed Read (30 posts)',
    metric: 'application_response_time',
    unit: 'ms',
    postgres: {
      engine: 'PostgreSQL',
      responseTimeMs: pgMedianApp,
      medianMs: pgMedianApp,
      p95Ms: calculateP95(pgAppSamples),
      dbExecutionMs: pgMedianDb,
      samples: pgAppSamples
    },
    mongodb: {
      engine: 'MongoDB',
      responseTimeMs: mongoMedianApp,
      medianMs: mongoMedianApp,
      p95Ms: calculateP95(mongoAppSamples),
      dbExecutionMs: mongoMedianDb,
      samples: mongoAppSamples
    },
    comparison: {
      fasterEngine,
      differencePercent: diffPct,
      isEquivalent,
      statement: isEquivalent
        ? 'Response times are approximately equivalent in this measured operation.'
        : `${fasterEngine}: ${diffPct}% lower response time in this measured operation`
    }
  };

  latestComparison = result;
  return result;
}

function getLatestComparison() {
  return latestComparison;
}

function setLatestComparison(comp) {
  latestComparison = comp;
  return latestComparison;
}

module.exports = {
  runControlledComparison,
  getLatestComparison,
  setLatestComparison
};
