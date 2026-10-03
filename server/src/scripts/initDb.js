const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/postgres');
const { connectMongo, getDb, closeMongo } = require('../config/mongodb');
const config = require('../config/env');

const FIXED_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';

const initPostgres = async () => {
  console.log('[PostgreSQL] Initializing schema, tables, indexes, and triggers...');

  const ddl = `
    -- Enable cryptographic extensions
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. POSTS TABLE
    CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
        comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
        search_vector TSVECTOR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);

    -- 3. COMMENTS TABLE
    CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

    -- 4. POST LIKES TABLE (JUNCTION)
    CREATE TABLE IF NOT EXISTS post_likes (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

    -- 5. TRIGGERS
    -- A. Full-Text Search Vector Generator Trigger
    CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
    BEGIN
        NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_posts_search_vector ON posts;
    CREATE TRIGGER trg_posts_search_vector
    BEFORE INSERT OR UPDATE OF content ON posts
    FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

    -- B. Like Counter Maintenance Triggers
    CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS trigger AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
            RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
            RETURN OLD;
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_post_likes_count ON post_likes;
    CREATE TRIGGER trg_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

    -- C. Comment Counter Maintenance Triggers
    CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS trigger AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
            RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
            RETURN OLD;
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_comments_count ON comments;
    CREATE TRIGGER trg_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
  `;

  await query(ddl);
  console.log('[PostgreSQL] Tables, indexes, and triggers initialized successfully.');
};

const initMongo = async () => {
  console.log('[MongoDB] Initializing collections and indexes...');
  const db = await connectMongo();

  // 1. Users collection & indexes
  const usersColl = db.collection('users');
  await usersColl.createIndex({ username: 1 }, { unique: true });
  await usersColl.createIndex({ email: 1 }, { unique: true });

  // 2. Posts collection & indexes
  const postsColl = db.collection('posts');
  await postsColl.createIndex({ createdAt: -1 });
  await postsColl.createIndex({ authorId: 1, createdAt: -1 });
  await postsColl.createIndex({ content: 'text' }, { name: 'content_text_idx' });

  // 3. Comments collection & indexes
  const commentsColl = db.collection('comments');
  await commentsColl.createIndex({ postId: 1, createdAt: 1 });
  await commentsColl.createIndex({ authorId: 1 });

  // 4. Post_likes collection & indexes
  const likesColl = db.collection('post_likes');
  await likesColl.createIndex({ postId: 1, userId: 1 }, { unique: true });
  await likesColl.createIndex({ userId: 1 });

  console.log('[MongoDB] Collections and indexes initialized successfully.');
};

const seedAdminUser = async () => {
  console.log('[Seed] Ensuring default admin account exists in both databases...');
  const passwordHash = await bcrypt.hash(config.admin.password, 10);
  const adminDoc = {
    name: 'Sync Administrator',
    username: 'admin',
    email: config.admin.email,
    passwordHash: passwordHash,
    bio: 'System Administrator & Database Analytics Lab Supervisor',
    avatarUrl: '',
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Seed into PostgreSQL
  const pgSql = `
    INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      is_admin = TRUE,
      updated_at = NOW();
  `;
  await query(pgSql, [
    FIXED_ADMIN_ID,
    adminDoc.name,
    adminDoc.username,
    adminDoc.email,
    adminDoc.passwordHash,
    adminDoc.bio,
    adminDoc.avatarUrl,
    true,
    adminDoc.createdAt,
    adminDoc.updatedAt,
  ]);
  console.log('[Seed] PostgreSQL admin user ready:', adminDoc.email);

  // Seed into MongoDB
  const db = getDb();
  await db.collection('users').updateOne(
    { email: adminDoc.email },
    {
      $set: {
        name: adminDoc.name,
        username: adminDoc.username,
        email: adminDoc.email,
        passwordHash: adminDoc.passwordHash,
        bio: adminDoc.bio,
        avatarUrl: adminDoc.avatarUrl,
        isAdmin: true,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: FIXED_ADMIN_ID,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log('[Seed] MongoDB admin user ready:', adminDoc.email);
};

const runInit = async () => {
  try {
    await initPostgres();
    await initMongo();
    await seedAdminUser();
    console.log('\n======================================================');
    console.log('✅ Both PostgreSQL and MongoDB databases initialized!');
    console.log(`Admin Email:    ${config.admin.email}`);
    console.log(`Admin Password: ${config.admin.password}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
    await closeMongo();
  }
};

runInit();
