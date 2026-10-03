const systemState = require('../config/state');

// Rolling metrics buffer for live admin telemetry (last 1,000 requests)
class MetricsTracker {
  constructor() {
    this.totalRequests = 0;
    this.errorCount = 0;
    this.latencies = []; // Circular rolling window of last 1000 latencies
    this.maxWindow = 1000;
    this.startTime = Date.now();
  }

  record(latencyMs, isError = false) {
    this.totalRequests++;
    if (isError) this.errorCount++;

    this.latencies.push(latencyMs);
    if (this.latencies.length > this.maxWindow) {
      this.latencies.shift();
    }
  }

  getSnapshot() {
    const uptimeSec = Math.max(1, (Date.now() - this.startTime) / 1000);
    const count = this.latencies.length;
    if (count === 0) {
      return {
        totalRequests: this.totalRequests,
        requestsPerSec: 0,
        averageLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        errorCount: this.errorCount,
        errorRatePct: 0,
        uptimeSec: Math.round(uptimeSec),
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avg = parseFloat((sum / count).toFixed(2));
    const p50 = parseFloat(sorted[Math.floor(count * 0.5)].toFixed(2));
    const p95 = parseFloat(sorted[Math.floor(count * 0.95)].toFixed(2));
    const p99 = parseFloat(sorted[Math.floor(count * 0.99)].toFixed(2));

    return {
      totalRequests: this.totalRequests,
      requestsPerSec: parseFloat((this.totalRequests / uptimeSec).toFixed(2)),
      averageLatencyMs: avg,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      errorCount: this.errorCount,
      errorRatePct: parseFloat(((this.errorCount / Math.max(1, this.totalRequests)) * 100).toFixed(2)),
      uptimeSec: Math.round(uptimeSec),
    };
  }
}

const tracker = new MetricsTracker();

const timingMiddleware = (req, res, next) => {
  const start = performance.now();
  const engine = systemState.getActiveEngine();

  // Set initial engine header
  res.setHeader('X-Database-Engine', engine);

  // Intercept response write to calculate duration before headers are sent to client
  const originalSend = res.send;
  res.send = function (body) {
    if (!res.headersSent) {
      const duration = performance.now() - start;
      const durationFormatted = parseFloat(duration.toFixed(2));
      res.setHeader('X-Response-Time-Ms', durationFormatted);
      tracker.record(durationFormatted, res.statusCode >= 400);
    }
    return originalSend.apply(this, arguments);
  };

  next();
};

module.exports = {
  timingMiddleware,
  tracker,
};
