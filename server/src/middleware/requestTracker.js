const { getActiveEngine } = require('../config/engineState');

// Separate request logs and latency samples per engine
const engineData = {
  POSTGRES: {
    latencies: [],
    requests: [],
    totalRequests: 0,
    totalErrors: 0,
  },
  MONGODB: {
    latencies: [],
    requests: [],
    totalRequests: 0,
    totalErrors: 0,
  }
};

function trackRequest(req, res, next) {
  // Do not track internal admin dashboard metrics polling to avoid skewing user metrics
  if (req.path.startsWith('/api/admin') || req.path === '/api/health') {
    return next();
  }

  const startHr = process.hrtime.bigint();
  const currentEngineKey = getActiveEngine() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  const engineBucket = engineData[currentEngineKey];

  engineBucket.totalRequests++;

  res.on('finish', () => {
    const endHr = process.hrtime.bigint();
    const latencyMs = parseFloat((Number(endHr - startHr) / 1e6).toFixed(2));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentEngineName = currentEngineKey === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB';

    if (res.statusCode >= 400) {
      engineBucket.totalErrors++;
    }

    engineBucket.latencies.push(latencyMs);
    if (engineBucket.latencies.length > 200) {
      engineBucket.latencies.shift();
    }

    const record = {
      time: timeStr,
      operation: `${req.method} ${req.baseUrl || ''}${req.path}`,
      engine: currentEngineName,
      status: res.statusCode,
      latencyMs: latencyMs
    };

    engineBucket.requests.unshift(record);
    if (engineBucket.requests.length > 20) {
      engineBucket.requests.pop();
    }
  });

  next();
}

function clearOnEngineSwitch(newEngine) {
  const key = newEngine?.toUpperCase() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  // Clear live stream for fresh recording on the newly selected engine
  engineData[key].requests = [];
  console.log(`[Request Tracker] Live stream cleared for newly activated engine: ${key}`);
}

function getPerformanceStats() {
  const currentEngineKey = getActiveEngine() === 'POSTGRES' ? 'POSTGRES' : 'MONGODB';
  const currentEngineName = currentEngineKey === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB';
  const bucket = engineData[currentEngineKey];

  const latencies = bucket.latencies;
  const count = latencies.length;

  let currentLatency = 0;
  let avgLatency = 0;
  let p50 = 0;
  let p95 = 0;
  let p99 = 0;

  if (count > 0) {
    const sorted = [...latencies].sort((a, b) => a - b);
    currentLatency = latencies[latencies.length - 1];
    avgLatency = parseFloat((sorted.reduce((a, b) => a + b, 0) / count).toFixed(2));
    p50 = sorted[Math.floor(count * 0.50)] || sorted[0];
    p95 = sorted[Math.floor(count * 0.95)] || sorted[count - 1];
    p99 = sorted[Math.floor(count * 0.99)] || sorted[count - 1];
  } else {
    // No requests recorded yet on this engine instance
    currentLatency = null;
    avgLatency = null;
    p50 = null;
    p95 = null;
    p99 = null;
  }

  const totalReqs = bucket.totalRequests;
  const totalErrs = bucket.totalErrors;
  const errorRate = totalReqs > 0 ? parseFloat(((totalErrs / totalReqs) * 100).toFixed(2)) : 0.00;

  // Filter requests strictly to the active engine only
  const activeRequests = bucket.requests.filter(r => r.engine === currentEngineName);

  return {
    activeEngine: currentEngineName,
    currentLatency: currentLatency !== null ? parseFloat(currentLatency.toFixed(2)) : null,
    avgLatency: avgLatency !== null ? parseFloat(avgLatency.toFixed(2)) : null,
    p50: p50 !== null ? parseFloat(p50.toFixed(2)) : null,
    p95: p95 !== null ? parseFloat(p95.toFixed(2)) : null,
    p99: p99 !== null ? parseFloat(p99.toFixed(2)) : null,
    throughput: count > 0 ? Math.min(count, 120) : 0, // real ops observed
    requests: totalReqs,
    errors: totalErrs,
    errorRate: errorRate,
    recentRequests: activeRequests
  };
}

module.exports = {
  trackRequest,
  clearOnEngineSwitch,
  getPerformanceStats
};
