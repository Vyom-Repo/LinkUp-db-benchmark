const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected pool error on idle client:', err.message);
});

async function query(text, params) {
  const start = process.hrtime.bigint();
  const res = await pool.query(text, params);
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  return { ...res, durationMs };
}

async function getClient() {
  return await pool.connect();
}

async function testPostgresConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time, current_database() as db_name;');
    return {
      connected: true,
      database: res.rows[0].db_name,
      timestamp: res.rows[0].current_time,
    };
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testPostgresConnection,
};
