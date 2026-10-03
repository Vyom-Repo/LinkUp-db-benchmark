const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');
const { pool, query } = require('../config/postgres');
const { connectMongo, closeMongo } = require('../config/mongodb');

async function ensurePostgresDatabase() {
  const rootClient = new Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.user,
    password: config.postgres.password,
  });

  await rootClient.connect();
  try {
    const checkDb = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1;",
      [config.postgres.database]
    );

    if (checkDb.rows.length === 0) {
      console.log(`[PostgreSQL] Creating database "${config.postgres.database}"...`);
      await rootClient.query(`CREATE DATABASE "${config.postgres.database}";`);
      console.log(`[PostgreSQL] Database "${config.postgres.database}" created.`);
    } else {
      console.log(`[PostgreSQL] Database "${config.postgres.database}" already exists.`);
    }
  } finally {
    await rootClient.end();
  }
}

async function initPostgresSchema() {
  console.log('[PostgreSQL] Initializing 3NF schema tables & indexes...');

  // 1. Users Table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Posts Table
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY,
      author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image_url TEXT,
      like_count INT NOT NULL DEFAULT 0,
      comment_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 3. Post Likes Table (Normalized 3NF relational model)
  await query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id UUID PRIMARY KEY,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_post_user_like UNIQUE (post_id, user_id)
    );
  `);

  // 4. Comments Table
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 5. Follows Table
  await query(`
    CREATE TABLE IF NOT EXISTS follows (
      id UUID PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_follower_following UNIQUE (follower_id, following_id)
    );
  `);

  // 6. Benchmarks Table (Logs academic comparison metrics)
  await query(`
    CREATE TABLE IF NOT EXISTS benchmarks (
      id UUID PRIMARY KEY,
      database VARCHAR(20) NOT NULL,
      operation VARCHAR(50) NOT NULL,
      record_count INT NOT NULL,
      latency_ms NUMERIC(10, 3) NOT NULL,
      memory_mb NUMERIC(10, 2) NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Optimization Indexes for High Performance Queries
  await query(`
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON post_likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
  `);

  console.log('✅ [PostgreSQL] Schema, tables, constraints, and indexes initialized successfully.');
}

async function initMongoSchema() {
  console.log('[MongoDB] Initializing collections & performance indexes...');
  const db = await connectMongo();

  // Create Collections if not already existing
  const collections = ['users', 'posts', 'post_likes', 'comments', 'follows', 'benchmarks'];
  const existing = (await db.listCollections().toArray()).map((c) => c.name);

  for (const col of collections) {
    if (!existing.includes(col)) {
      await db.createCollection(col);
    }
  }

  // 1. Users Indexes
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  // 2. Posts Indexes
  await db.collection('posts').createIndex({ authorId: 1 });
  await db.collection('posts').createIndex({ createdAt: -1 });

  // 3. Post Likes Indexes (Mirroring PostgreSQL unique composite constraint)
  await db.collection('post_likes').createIndex({ postId: 1, userId: 1 }, { unique: true });
  await db.collection('post_likes').createIndex({ postId: 1 });
  await db.collection('post_likes').createIndex({ userId: 1 });

  // 4. Comments Indexes
  await db.collection('comments').createIndex({ postId: 1 });
  await db.collection('comments').createIndex({ authorId: 1 });
  await db.collection('comments').createIndex({ createdAt: 1 });

  // 5. Follows Indexes
  await db.collection('follows').createIndex({ followerId: 1, followingId: 1 }, { unique: true });
  await db.collection('follows').createIndex({ followerId: 1 });
  await db.collection('follows').createIndex({ followingId: 1 });

  // 6. Benchmarks Indexes
  await db.collection('benchmarks').createIndex({ database: 1, operation: 1, timestamp: -1 });

  console.log('✅ [MongoDB] Collections and comparative indexes initialized successfully.');
}

async function seedAdminUser() {
  console.log('[Admin] Ensuring root administrator account exists in both databases...');
  const adminId = 'a0000000-0000-4000-8000-000000000001';
  const email = 'admin@sync.local';
  const username = 'admin';
  const name = 'Sync Administrator';
  const passwordHash = await bcrypt.hash('Admin@Sync2026!', 10);
  const now = new Date();

  // 1. PostgreSQL Admin
  await query(
    `INSERT INTO users (id, name, username, email, password_hash, is_admin, bio, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO NOTHING;`,
    [adminId, name, username, email, passwordHash, true, 'System administrator for database telemetry.', now, now]
  );

  // 2. MongoDB Admin
  const db = await connectMongo();
  await db.collection('users').updateOne(
    { email },
    {
      $setOnInsert: {
        _id: adminId,
        id: adminId,
        name,
        username,
        email,
        passwordHash,
        isAdmin: true,
        bio: 'System administrator for database telemetry.',
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  console.log('✅ [Admin] Administrator account verified: admin@sync.local (Admin@Sync2026!)');
}

async function run() {
  try {
    console.log('========================================================');
    console.log('⚡ Initializing Database Foundations: PostgreSQL & MongoDB');
    console.log('========================================================');

    await ensurePostgresDatabase();
    await initPostgresSchema();
    await initMongoSchema();
    await seedAdminUser();

    console.log('========================================================');
    console.log('🚀 Database initialization complete and verified!');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    await closeMongo();
  }
}

run();
