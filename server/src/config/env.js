const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultDb: (process.env.DEFAULT_DB || 'POSTGRES').toUpperCase(),
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    database: process.env.PG_DATABASE || 'sync_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/sync_db',
    dbName: process.env.MONGO_DB_NAME || 'sync_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sync_super_secret_jwt_key_2026_adbms_wad',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

module.exports = config;
