const { performance } = require('perf_hooks');
const { connectMongo } = require('../config/mongodb');
const postRepo = require('../repositories/postRepository');

// Cache latest comparison result in memory so dashboard shows it on load
let latestComparison = null;

/**
 * Measure full application-level response time for an identical operation on a specific engine
 * START TIMER -> Repository call -> Transformation / JSON serialization -> STOP TIMER
 */
// Deterministic comparison user that exists in both PostgreSQL and MongoDB
const COMPARISON_USER_ID = 'a0000000-0000-4000-8000-000000000001';

/**
 * Measure full application-level response time for the identical Feed operation on a specific engine
 * START TIMER -> Repository call -> Transformation / JSON serialization -> STOP TIMER
 */
async function measureApplicationOperation(engine, operation = 'feed_read', seed = null, currentUserId = COMPARISON_USER_ID) {
  const t0 = performance.now();
  let dbExecutionMs = 0;

  if (operation === 'feed_read') {
    const limit = 30;
    const page = 1;
    const offset = 0;
    const sort = ''; // Reproduce actual User Feed query semantics (no index bypass)
    const q = '';    // Reproduce actual User Feed query
    const feedSeed = seed || Date.now().toString();

    // Actual Feed repository invocation with authenticated user context
    const result = await postRepo.getFeed({
      currentUserId: currentUserId || COMPARISON_USER_ID,
      limit,
      page,
      offset,
      sort,
      q,
      seed: feedSeed,
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
 * reproducing the ACTUAL User Feed workload (limit 30, seeded ordering, user like checks):
 * - 2 warmup executions per engine (unrecorded)
 * - 5 sample executions per engine with alternating order
 * - Same seed passed to both engines for each run
 * - Median / P50 aggregation
 * - Both End-to-End Application Response Time and raw DB Execution Time recorded separately
 */
async function runControlledComparison(operation = 'feed_read', currentUserId = COMPARISON_USER_ID) {
  // Ensure Mongo connection pool is established
  try {
    await connectMongo();
  } catch (err) {
    console.error('[Comparison Connect Error]:', err.message);
  }

  // 1. Warm-up runs (unrecorded, 2 per engine) to ensure buffer cache fairness
  try {
    const warmupSeed = 'warmup_seed_' + Date.now();
    await measureApplicationOperation('POSTGRES', operation, warmupSeed, currentUserId);
    await measureApplicationOperation('MONGODB', operation, warmupSeed, currentUserId);
    await measureApplicationOperation('POSTGRES', operation, warmupSeed, currentUserId);
    await measureApplicationOperation('MONGODB', operation, warmupSeed, currentUserId);
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
    // Generate a shared seed for both engines in this sample
    const sampleSeed = 'feed_cmp_seed_' + Date.now() + '_' + i;

    // Alternating execution order to eliminate any sequential bias
    if (i % 2 === 0) {
      const pgRes = await measureApplicationOperation('POSTGRES', operation, sampleSeed, currentUserId);
      pgAppSamples.push(pgRes.appResponseMs);
      pgDbSamples.push(pgRes.dbExecutionMs);

      const mongoRes = await measureApplicationOperation('MONGODB', operation, sampleSeed, currentUserId);
      mongoAppSamples.push(mongoRes.appResponseMs);
      mongoDbSamples.push(mongoRes.dbExecutionMs);
    } else {
      const mongoRes = await measureApplicationOperation('MONGODB', operation, sampleSeed, currentUserId);
      mongoAppSamples.push(mongoRes.appResponseMs);
      mongoDbSamples.push(mongoRes.dbExecutionMs);

      const pgRes = await measureApplicationOperation('POSTGRES', operation, sampleSeed, currentUserId);
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
    operationLabel: 'Feed Read (30 posts · Actual Feed Workload)',
    metric: 'application_response_time',
    unit: 'ms',
    workload: {
      type: 'Feed Read',
      limit: 30,
      ordering: 'Seeded Feed Ordering',
      userContext: 'Authenticated',
      dataset: 'Current LinkUp Dataset',
      technicalDetails: {
        postgres: 'ORDER BY hashtext(p.id::text || $seed) DESC LIMIT 30 (with author join & post_likes check)',
        mongodb: '$sample: { size: 30 } aggregation pipeline with $lookup, $unwind, and post_likes check'
      }
    },
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
        ? 'Response times were approximately equivalent in this measured Feed operation.'
        : `${fasterEngine}: ${diffPct}% lower response time in this measured Feed operation.`
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
