/**
 * Calculates complete statistical distribution for benchmark latency measurements
 * @param {Array<number>} latenciesMs - Array of execution durations in milliseconds
 * @param {number} totalDurationMs - Total wall-clock time for the test run
 */
const calculateMetrics = (latenciesMs, totalDurationMs) => {
  const count = latenciesMs.length;
  if (count === 0) {
    return {
      iterations: 0,
      minMs: 0,
      maxMs: 0,
      meanMs: 0,
      medianMs: 0,
      p95Ms: 0,
      p99Ms: 0,
      stdDevMs: 0,
      throughputOpsSec: 0,
    };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  // Median (P50)
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  // Percentiles
  const p95 = sorted[Math.floor(count * 0.95)];
  const p99 = sorted[Math.floor(count * 0.99)];

  // Sample Standard Deviation: sqrt( sum( (x - mean)^2 ) / (N - 1) )
  let variance = 0;
  if (count > 1) {
    const sumSquares = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    variance = sumSquares / (count - 1);
  }
  const stdDev = Math.sqrt(variance);

  // Throughput: ops / sec
  const totalSec = Math.max(0.001, totalDurationMs / 1000);
  const throughput = count / totalSec;

  return {
    iterations: count,
    minMs: parseFloat(min.toFixed(3)),
    maxMs: parseFloat(max.toFixed(3)),
    meanMs: parseFloat(mean.toFixed(3)),
    medianMs: parseFloat(median.toFixed(3)),
    p95Ms: parseFloat(p95.toFixed(3)),
    p99Ms: parseFloat(p99.toFixed(3)),
    stdDevMs: parseFloat(stdDev.toFixed(3)),
    throughputOpsSec: parseFloat(throughput.toFixed(2)),
  };
};

module.exports = {
  calculateMetrics,
};
