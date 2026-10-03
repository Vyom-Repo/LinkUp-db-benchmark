const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    database: process.env.PG_DATABASE || 'sync_db',
    user: process.env.PG_USER || 'vyom',
    password: process.env.PG_PASSWORD || '',
    maxPool: parseInt(process.env.PG_MAX_POOL, 10) || 10,
  },
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/sync_db',
    maxPool: parseInt(process.env.MONGO_MAX_POOL, 10) || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_development_secret_key_123',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  defaultDatabase: (process.env.DEFAULT_DATABASE || 'postgres').toLowerCase(),
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@sync.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@Sync2026!',
  },
};

module.exports = config;
