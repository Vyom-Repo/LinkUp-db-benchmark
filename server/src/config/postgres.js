const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password || undefined,
  max: config.postgres.maxPool,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a dedicated client for transactions or session-level settings
 */
const getClient = () => pool.connect();

/**
 * Check PostgreSQL health
 */
const checkHealth = async () => {
  try {
    const start = Date.now();
    const res = await pool.query('SELECT 1 as healthy, NOW() as server_time');
    const latency = Date.now() - start;
    return {
      status: 'connected',
      latencyMs: latency,
      serverTime: res.rows[0].server_time,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
    };
  }
};

module.exports = {
  pool,
  query,
  getClient,
  checkHealth,
};
