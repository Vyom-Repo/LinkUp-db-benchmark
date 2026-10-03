const { getActiveEngine } = require('../config/engineState');

// Separate request logs and latency samples per engine
const engineData = {
  POSTGRES: {
    latencies: [],          // Total API response latencies
    dbLatencies: [],        // Dedicated DB execution latencies
    requests: [],           // Live request records
    totalRequests: 0,
    totalErrors: 0,
    timestamps: [],         // Used for real throughput calculation
  },
  MONGODB: {
    latencies: [],
    dbLatencies: [],
    requests: [],
    totalRequests: 0,
    totalErrors: 0,
    timestamps: [],
  }
};

function trackRequest(req, res, next) {
  // Do not track internal admin dashboard metrics polling or health checks to prevent skewing user metrics
  if (req.path.startsWith('/api/admin') || req.path === '/api/health' || req.path === '/api/db-status') {
    return next();
  }

  const startNow = performance.now();
  const currentEngineKey = getActiveEngine() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  const engineBucket = engineData[currentEngineKey];

  engineBucket.totalRequests++;

  res.on('finish', () => {
    const endNow = performance.now();
    const totalResponseMs = parseFloat((endNow - startNow).toFixed(2));
    const dbExecutionMs = typeof res.locals.dbExecutionMs === 'number'
      ? parseFloat(res.locals.dbExecutionMs.toFixed(2))
      : null;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const currentEngineName = currentEngineKey === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB';

    if (res.statusCode >= 400) {
      engineBucket.totalErrors++;
    }

    engineBucket.latencies.push(totalResponseMs);
    if (dbExecutionMs !== null) {
      engineBucket.dbLatencies.push(dbExecutionMs);
    }
    engineBucket.timestamps.push(Date.now());

    // Rolling sample window capped at 500 samples
    if (engineBucket.latencies.length > 500) {
      engineBucket.latencies.shift();
    }
    if (engineBucket.dbLatencies.length > 500) {
      engineBucket.dbLatencies.shift();
    }
    // Retain timestamps within the last 60 seconds for true rolling throughput
    const sixtySecsAgo = Date.now() - 60000;
    while (engineBucket.timestamps.length > 0 && engineBucket.timestamps[0] < sixtySecsAgo) {
      engineBucket.timestamps.shift();
    }

    const endpointPath = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl.split('?')[0];

    const record = {
      timestamp: timeStr,
      time: timeStr,
      method: req.method,
      endpoint: endpointPath,
      operation: `${req.method} ${endpointPath}`,
      engine: currentEngineName,
      status: res.statusCode,
      dbExecutionMs: dbExecutionMs !== null ? dbExecutionMs : totalResponseMs,
      totalResponseMs: totalResponseMs,
      latencyMs: totalResponseMs
    };

    engineBucket.requests.unshift(record);
    if (engineBucket.requests.length > 30) {
      engineBucket.requests.pop();
    }
  });

  next();
}

function clearOnEngineSwitch(newEngine) {
  const key = newEngine?.toUpperCase() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  engineData[key].requests = [];
  console.log(`[Request Tracker] Live stream cleared for newly activated engine: ${key}`);
}

function getPerformanceStats() {
  const currentEngineKey = getActiveEngine() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  const currentEngineName = currentEngineKey === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB';
  const bucket = engineData[currentEngineKey];

  const samples = bucket.latencies;
  const count = samples.length;

  let min = null;
  let max = null;
  let mean = null;
  let p50 = null;
  let p95 = null;
  let p99 = null;
  let stdDev = null;
  let currentLatency = null;
  let avgDbLatency = null;

  if (count > 0) {
    const sorted = [...samples].sort((a, b) => a - b);
    min = sorted[0];
    max = sorted[sorted.length - 1];
    currentLatency = samples[samples.length - 1];

    const sum = sorted.reduce((a, b) => a + b, 0);
    mean = parseFloat((sum / count).toFixed(2));

    p50 = sorted[Math.floor(count * 0.50)] || sorted[0];
    p95 = sorted[Math.floor(count * 0.95)] || sorted[count - 1];
    p99 = sorted[Math.floor(count * 0.99)] || sorted[count - 1];

    const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

    if (bucket.dbLatencies.length > 0) {
      const dbSum = bucket.dbLatencies.reduce((a, b) => a + b, 0);
      avgDbLatency = parseFloat((dbSum / bucket.dbLatencies.length).toFixed(2));
    }
  }

  // Calculate real throughput over rolling active window (ops / second)
  const windowSeconds = Math.max(1, (Date.now() - (bucket.timestamps[0] || Date.now())) / 1000);
  const throughput = bucket.timestamps.length > 0
    ? parseFloat((bucket.timestamps.length / Math.min(windowSeconds, 60)).toFixed(1))
    : 0;

  const totalReqs = bucket.totalRequests;
  const totalErrs = bucket.totalErrors;
  const errorRate = totalReqs > 0 ? parseFloat(((totalErrs / totalReqs) * 100).toFixed(2)) : 0.00;

  // Filter requests strictly to the active engine only
  const activeRequests = bucket.requests.filter(r => r.engine === currentEngineName);

  return {
    activeEngine: currentEngineName,
    currentLatency: currentLatency !== null ? parseFloat(currentLatency.toFixed(2)) : null,
    avgLatency: mean,
    avgDbLatency: avgDbLatency,
    min,
    max,
    mean,
    p50: p50 !== null ? parseFloat(p50.toFixed(2)) : null,
    p95: p95 !== null ? parseFloat(p95.toFixed(2)) : null,
    p99: p99 !== null ? parseFloat(p99.toFixed(2)) : null,
    stdDev,
    throughput,
    requests: totalReqs,
    sampleCount: count,
    errors: totalErrs,
    errorRate,
    recentRequests: activeRequests
  };
}

module.exports = {
  trackRequest,
  clearOnEngineSwitch,
  getPerformanceStats
};
