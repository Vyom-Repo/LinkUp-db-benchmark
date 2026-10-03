const crypto = require('crypto');
const os = require('os');
const { postgres, mongodb } = require('../repositories');
const { calculateMetrics } = require('./metricsCalculator');

/**
 * Capture snapshot of all controlled environment variables
 */
const getControlledEnvironment = () => {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuModel: os.cpus()[0]?.model || 'Unknown CPU',
    cpuCores: os.cpus().length,
    v8HeapLimitMB: Math.round(require('v8').getHeapStatistics().heap_size_limit / (1024 * 1024)),
    osMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Execute an individual experiment on a specific target engine
 */
const executeEngineExperiment = async (engineName, experimentType, iterations, warmupCount = 3) => {
  const isPg = engineName === 'postgres';
  const targetRepo = isPg ? postgres : mongodb;
  const latencies = [];

  // 1. Warm-up Phase (Unrecorded)
  for (let w = 0; w < warmupCount; w++) {
    if (experimentType === 'feed_read') {
      await targetRepo.posts.getFeed({ limit: 20 });
    } else if (experimentType === 'search') {
      await targetRepo.posts.search({ queryText: 'database' });
    } else if (experimentType === 'aggregation') {
      await targetRepo.posts.getTopEngaged(5);
    }
  }

  // 2. Timed Experiment Loop
  const runStart = performance.now();

  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();

    switch (experimentType) {
      case 'feed_read': {
        await targetRepo.posts.getFeed({ limit: 20, offset: (i % 5) * 20 });
        break;
      }

      case 'search': {
        const terms = ['database', 'indexing', 'relational', 'scalable', 'latency'];
        const queryText = terms[i % terms.length];
        await targetRepo.posts.search({ queryText, limit: 20 });
        break;
      }

      case 'aggregation': {
        await targetRepo.posts.getTopEngaged(5);
        break;
      }

      case 'single_insert': {
        const testId = crypto.randomUUID();
        await targetRepo.posts.create({
          id: testId,
          authorId: 'a0000000-0000-4000-8000-000000000001',
          content: `Benchmark insert payload iteration #${i}`,
        });
        break;
      }

      case 'point_update': {
        // Update admin post
        await targetRepo.posts.update({
          id: 'f0000000-0000-4000-8000-000000000001',
          authorId: 'a0000000-0000-4000-8000-000000000001',
          content: `Benchmark updated content iteration #${i} at ${Date.now()}`,
        });
        break;
      }

      case 'like_toggle': {
        const userId = 'a0000000-0000-4000-8000-000000000001';
        if (i % 2 === 0) {
          await targetRepo.likes.addLike({ postId: 'f0000000-0000-4000-8000-000000000001', userId });
        } else {
          await targetRepo.likes.removeLike({ postId: 'f0000000-0000-4000-8000-000000000001', userId });
        }
        break;
      }

      case 'cascade_delete': {
        // Dedicated cascade fixture: 1 post + 50 comments + 100 likes
        const cascadePostId = crypto.randomUUID();
        await targetRepo.posts.create({
          id: cascadePostId,
          authorId: 'a0000000-0000-4000-8000-000000000001',
          content: 'Cascade fixture post to delete',
        });

        // Insert 50 comments
        for (let c = 0; c < 50; c++) {
          await targetRepo.comments.create({
            id: crypto.randomUUID(),
            postId: cascadePostId,
            authorId: 'a0000000-0000-4000-8000-000000000001',
            content: `Cascade comment #${c}`,
          });
        }

        // Insert 100 likes
        for (let l = 0; l < 100; l++) {
          await targetRepo.likes.addLike({
            postId: cascadePostId,
            userId: `cascade_user_${l}`,
          });
        }

        // Now time the actual cascading deletion!
        const deleteStart = performance.now();
        await targetRepo.posts.delete({ id: cascadePostId, isAdmin: true });
        const deleteDuration = performance.now() - deleteStart;
        latencies.push(deleteDuration);
        continue;
      }

      default:
        throw new Error(`Unsupported experiment type: ${experimentType}`);
    }

    const iterDuration = performance.now() - iterStart;
    latencies.push(iterDuration);
  }

  const totalDuration = performance.now() - runStart;
  return calculateMetrics(latencies, totalDuration);
};

/**
 * Setup/ensure shared fixture post for update/like tests
 */
const ensureBenchmarkFixtures = async () => {
  const fixtureId = 'f0000000-0000-4000-8000-000000000001';
  const authorId = 'a0000000-0000-4000-8000-000000000001';

  // Postgres
  const pgPost = await postgres.posts.findById(fixtureId);
  if (!pgPost) {
    await postgres.posts.create({
      id: fixtureId,
      authorId,
      content: 'Dedicated benchmark fixture post',
    });
  }

  // Mongo
  const mongoPost = await mongodb.posts.findById(fixtureId);
  if (!mongoPost) {
    await mongodb.posts.create({
      id: fixtureId,
      authorId,
      content: 'Dedicated benchmark fixture post',
    });
  }
};

/**
 * Teardown benchmark generated test debris
 */
const cleanupBenchmarkFixtures = async () => {
  try {
    // Delete any posts created with benchmark insert prefix
    const pg = require('../config/postgres');
    const mongo = require('../config/mongodb').getDb();

    await pg.query("DELETE FROM posts WHERE content LIKE 'Benchmark insert payload%'");
    await mongo.collection('posts').deleteMany({ content: { $regex: '^Benchmark insert payload' } });
  } catch (e) {
    // Ignore cleanup errors
  }
};

/**
 * Run a full controlled benchmark comparison
 */
const runBenchmark = async ({
  experiment = 'feed_read',
  iterations = 50,
  warmupCount = 3,
} = {}) => {
  const runId = crypto.randomUUID();
  const env = getControlledEnvironment();
  await ensureBenchmarkFixtures();

  // Randomize / alternate execution order to prevent first-runner bias
  const order = Math.random() > 0.5 ? ['postgres', 'mongodb'] : ['mongodb', 'postgres'];

  const results = {};

  for (const engine of order) {
    results[engine] = await executeEngineExperiment(engine, experiment, iterations, warmupCount);
  }

  await cleanupBenchmarkFixtures();

  // Comparative analysis calculations
  const pgMean = results.postgres.meanMs;
  const mongoMean = results.mongodb.meanMs;
  const fasterEngine = pgMean < mongoMean ? 'postgres' : 'mongodb';
  const ratio = parseFloat((Math.max(pgMean, mongoMean) / Math.max(0.001, Math.min(pgMean, mongoMean))).toFixed(2));

  return {
    runId,
    experiment,
    iterations,
    warmupCount,
    engineOrder: order,
    environment: env,
    results: {
      postgres: results.postgres,
      mongodb: results.mongodb,
    },
    comparison: {
      fasterEngine,
      latencyRatio: ratio,
      summary: `${fasterEngine.toUpperCase()} was ${ratio}x faster on average for ${experiment} (${iterations} iterations).`,
    },
    completedAt: new Date().toISOString(),
  };
};

module.exports = {
  runBenchmark,
  getControlledEnvironment,
};
