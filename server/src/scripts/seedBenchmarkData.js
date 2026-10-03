const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/postgres');
const { connectMongo, closeMongo } = require('../config/mongodb');

// High-variety technical discussion templates for ADBMS & WAD
const TOPICS = [
  'PostgreSQL vs MongoDB: Deep dive into B-Tree index scan vs WiredTiger collection scan performance.',
  'Benchmarking ACID transaction isolation levels: Read Committed vs Repeatable Read under heavy concurrent writes.',
  'Query optimization tips: Why sequential scan was chosen over index scan in PostgreSQL EXPLAIN ANALYZE.',
  'Normalized 3NF relational schemas vs Denormalized Document embeddings in high-scale social feeds.',
  'Comparing hash join and nested loop algorithms in relational query engines.',
  'Implementing connection pooling with pg.Pool vs MongoDB native driver connection manager.',
  'Database Sharding strategies: Range-based vs Hash-based partitioning in distributed NoSQL engines.',
  'Vite + React modern single page architecture with zero-latency optimistic updates.',
  'Indexing strategies: Composite multi-column indexes on (author_id, created_at DESC) for sub-millisecond lookups.',
  'How Snappy compression in MongoDB WiredTiger engine saves 60% disk storage compared to uncompressed row storage.',
  'CAP theorem trade-offs in distributed database systems: Consistency vs Availability during network partitions.',
  'Understanding Write-Ahead Logging (WAL) in PostgreSQL crash recovery and replication streams.',
  'MongoDB Change Streams vs PostgreSQL LISTEN/NOTIFY for real-time community discussion updates.',
  'JWT authentication security best practices: HttpOnly cookies vs Bearer token storage.',
  'Database benchmark methodology: P95 and P99 latency percentiles under sustained read/write pressure.',
  'Analyzing disk I/O bottlenecks when dataset size exceeds available RAM buffer cache (shared_buffers).',
  'GTU Sem 5 WAD & ADBMS final project demo: Live comparative database benchmark visualization.',
  'Building responsive multi-column community layouts with CSS Grid and flexbox without frameworks.',
  'Evaluating MongoDB aggregation pipelines ($group, $sort, $lookup) vs SQL relational JOINs.',
  'Preventing N+1 query problems in REST APIs using batch queries and EXISTS subqueries.'
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
  null,
  null,
  null // 30% posts have images, 70% are pure technical text
];

const COMMENT_SNIPPETS = [
  'Excellent analysis! The B-Tree traversal cost difference makes total sense here.',
  'Have you measured the cache hit ratio with pg_statio_user_tables?',
  'Great point about Snappy compression trade-offs with CPU cycles.',
  'In our experiments, MongoDB showed lower latency on unstructured payload inserts.',
  'Postgres handles complex analytical multi-table JOINs much more gracefully.',
  'Are you running this with synchronous_commit turned off or on?',
  'Super clean explanation for the ADBMS presentation!',
  'We noticed page fault spikes when table sizes exceeded shared_buffers.',
  'Agreed! Index maintenance overhead becomes noticeable on bulk batch writes.',
  'Looking forward to seeing the benchmark graphs on this.'
];

const FIRST_NAMES = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Kavya', 'Dev', 'Aditya', 'Ishaan', 'Neha', 'Riya', 'Rahul', 'Sneha', 'Arjun', 'Tanvi', 'Karan'];
const LAST_NAMES = ['Patel', 'Shah', 'Sharma', 'Verma', 'Mehta', 'Joshi', 'Desai', 'Prajapati', 'Modi', 'Trivedi', 'Bhatt', 'Pandya'];

async function seedBenchmarkData() {
  console.log('================================================================');
  console.log('🚀 LINKUP HIGH-PERFORMANCE DUAL-DATABASE BENCHMARK SEEDER');
  console.log('Target: 30,000 Posts | 120,000 Comments | 250,000 Likes');
  console.log('Persisting simultaneously into PostgreSQL (3NF) & MongoDB');
  console.log('================================================================\n');

  const startTime = Date.now();
  const mongoDb = await connectMongo();

  // ─────────────────────────────────────────────────────────────
  // 1. SEED AUTHORS / USERS
  // ─────────────────────────────────────────────────────────────
  console.log('[Step 1/4] Ensuring community users exist in both databases...');
  const existingUsers = await query('SELECT id, username FROM users;');
  const authors = [...existingUsers.rows];

  const targetNewUsers = 100;
  const passwordHash = await bcrypt.hash('User@Sync2026', 8);

  const newUsersPg = [];
  const newUsersMongo = [];

  for (let i = 0; i < targetNewUsers; i++) {
    const fName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const username = `${fName.toLowerCase()}_${lName.toLowerCase()}_${i + 1}`;
    const id = crypto.randomUUID();
    const email = `${username}@student.gtu.ac.in`;
    const name = `${fName} ${lName}`;
    const bio = `Computer Engineering student @ GTU | Exploring ADBMS & Web Systems`;
    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
    const now = new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000));

    newUsersPg.push({ id, name, username, email, passwordHash, bio, avatarUrl, now });
    newUsersMongo.push({ _id: id, id, name, username, email, passwordHash, bio, avatarUrl, isAdmin: false, createdAt: now, updatedAt: now });
    authors.push({ id, username });
  }

  // Insert users in batches
  for (let i = 0; i < newUsersPg.length; i += 50) {
    const chunkPg = newUsersPg.slice(i, i + 50);
    const chunkMongo = newUsersMongo.slice(i, i + 50);

    const values = [];
    const params = [];
    let pIdx = 1;

    for (const u of chunkPg) {
      values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, false, $${pIdx++}, $${pIdx++})`);
      params.push(u.id, u.name, u.username, u.email, u.passwordHash, u.bio, u.avatarUrl, u.now, u.now);
    }

    await query(
      `INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at)
       VALUES ${values.join(', ')}
       ON CONFLICT (username) DO NOTHING;`,
      params
    );

    await mongoDb.collection('users').bulkWrite(
      chunkMongo.map((doc) => ({
        updateOne: {
          filter: { username: doc.username },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }))
    );
  }

  console.log(`✅ [Users] ${authors.length} total active author identities ready.\n`);

  // ─────────────────────────────────────────────────────────────
  // 2. SEED 30,000 POSTS IN BATCHES OF 1,000
  // ─────────────────────────────────────────────────────────────
  const TOTAL_POSTS = 30000;
  const POST_CHUNK_SIZE = 1000;
  console.log(`[Step 2/4] Generating and batch-inserting ${TOTAL_POSTS.toLocaleString()} posts...`);

  const createdPostIds = [];
  const postCreatedAtMap = new Map();

  for (let offset = 0; offset < TOTAL_POSTS; offset += POST_CHUNK_SIZE) {
    const pgPostRows = [];
    const mongoPostDocs = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < POST_CHUNK_SIZE; j++) {
      const globalIdx = offset + j;
      const postId = crypto.randomUUID();
      const author = authors[globalIdx % authors.length];
      const baseTopic = TOPICS[globalIdx % TOPICS.length];
      const content = `${baseTopic} [Benchmark Experiment #${globalIdx + 1}]`;
      const imageUrl = SAMPLE_IMAGES[globalIdx % SAMPLE_IMAGES.length];
      // Random creation date distributed over past 120 days
      const daysAgoMs = Math.floor(Math.random() * 120 * 86400000);
      const createdAt = new Date(Date.now() - daysAgoMs);

      createdPostIds.push(postId);
      postCreatedAtMap.set(postId, createdAt);

      // Multi-row INSERT placeholders for PostgreSQL
      pgPostRows.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 0, 0, $${pIdx++}, $${pIdx++})`);
      params.push(postId, author.id, content, imageUrl, createdAt, createdAt);

      // Document format for MongoDB
      mongoPostDocs.push({
        _id: postId,
        id: postId,
        authorId: author.id,
        content,
        imageUrl,
        likeCount: 0,
        commentCount: 0,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // A. PostgreSQL Batch Insert
    await query(
      `INSERT INTO posts (id, author_id, content, image_url, like_count, comment_count, created_at, updated_at)
       VALUES ${pgPostRows.join(', ')};`,
      params
    );

    // B. MongoDB Batch Insert
    await mongoDb.collection('posts').insertMany(mongoPostDocs, { ordered: false });

    process.stdout.write(`   ↳ Seeded ${Math.min(offset + POST_CHUNK_SIZE, TOTAL_POSTS).toLocaleString()} / ${TOTAL_POSTS.toLocaleString()} posts (${Math.round(((offset + POST_CHUNK_SIZE) / TOTAL_POSTS) * 100)}%)\r`);
  }
  console.log(`\n✅ [Posts] ${TOTAL_POSTS.toLocaleString()} posts dual-persisted successfully.\n`);

  // ─────────────────────────────────────────────────────────────
  // 3. SEED 120,000 COMMENTS IN BATCHES OF 2,000
  // ─────────────────────────────────────────────────────────────
  const TOTAL_COMMENTS = 120000;
  const COMMENT_CHUNK_SIZE = 2000;
  console.log(`[Step 3/4] Generating and batch-inserting ${TOTAL_COMMENTS.toLocaleString()} comments...`);

  for (let offset = 0; offset < TOTAL_COMMENTS; offset += COMMENT_CHUNK_SIZE) {
    const pgCommentRows = [];
    const mongoCommentDocs = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < COMMENT_CHUNK_SIZE; j++) {
      const globalIdx = offset + j;
      const commentId = crypto.randomUUID();
      const targetPostId = createdPostIds[globalIdx % createdPostIds.length];
      const commentAuthor = authors[(globalIdx + 3) % authors.length];
      const snippet = COMMENT_SNIPPETS[globalIdx % COMMENT_SNIPPETS.length];
      const content = `${snippet} (Ref #${globalIdx + 1})`;
      const postDate = postCreatedAtMap.get(targetPostId) || new Date();
      const commentDate = new Date(postDate.getTime() + Math.floor(Math.random() * 3600000 * 24));

      pgCommentRows.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
      params.push(commentId, targetPostId, commentAuthor.id, content, commentDate, commentDate);

      mongoCommentDocs.push({
        _id: commentId,
        id: commentId,
        postId: targetPostId,
        authorId: commentAuthor.id,
        content,
        createdAt: commentDate,
        updatedAt: commentDate,
      });
    }

    // A. PostgreSQL
    await query(
      `INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
       VALUES ${pgCommentRows.join(', ')};`,
      params
    );

    // B. MongoDB
    await mongoDb.collection('comments').insertMany(mongoCommentDocs, { ordered: false });

    process.stdout.write(`   ↳ Seeded ${Math.min(offset + COMMENT_CHUNK_SIZE, TOTAL_COMMENTS).toLocaleString()} / ${TOTAL_COMMENTS.toLocaleString()} comments (${Math.round(((offset + COMMENT_CHUNK_SIZE) / TOTAL_COMMENTS) * 100)}%)\r`);
  }
  console.log(`\n✅ [Comments] ${TOTAL_COMMENTS.toLocaleString()} comments dual-persisted successfully.\n`);

  // ─────────────────────────────────────────────────────────────
  // 4. SEED 250,000 LIKES IN BATCHES OF 5,000
  // ─────────────────────────────────────────────────────────────
  const TOTAL_LIKES = 250000;
  const LIKE_CHUNK_SIZE = 5000;
  console.log(`[Step 4/4] Generating and batch-inserting ${TOTAL_LIKES.toLocaleString()} post likes...`);

  // To guarantee uniqueness of (post_id, user_id), pair predictable combinations
  const numAuthors = authors.length;
  let likeCounter = 0;

  for (let offset = 0; offset < TOTAL_LIKES; offset += LIKE_CHUNK_SIZE) {
    const pgLikeRows = [];
    const mongoLikeDocs = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < LIKE_CHUNK_SIZE; j++) {
      const likeId = crypto.randomUUID();
      const postIdx = Math.floor(likeCounter / (numAuthors - 1)) % createdPostIds.length;
      const authorIdx = (likeCounter % (numAuthors - 1));
      likeCounter++;

      const targetPostId = createdPostIds[postIdx];
      const likingUser = authors[authorIdx];
      const now = new Date();

      pgLikeRows.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
      params.push(likeId, targetPostId, likingUser.id, now);

      mongoLikeDocs.push({
        _id: likeId,
        id: likeId,
        postId: targetPostId,
        userId: likingUser.id,
        createdAt: now,
      });
    }

    // A. PostgreSQL (with ON CONFLICT DO NOTHING to ensure safety)
    await query(
      `INSERT INTO post_likes (id, post_id, user_id, created_at)
       VALUES ${pgLikeRows.join(', ')}
       ON CONFLICT (post_id, user_id) DO NOTHING;`,
      params
    );

    // B. MongoDB (with ordered: false to skip any duplicate key)
    try {
      await mongoDb.collection('post_likes').insertMany(mongoLikeDocs, { ordered: false });
    } catch {
      // Ignore duplicate key warnings in bulk mode
    }

    process.stdout.write(`   ↳ Seeded ${Math.min(offset + LIKE_CHUNK_SIZE, TOTAL_LIKES).toLocaleString()} / ${TOTAL_LIKES.toLocaleString()} likes (${Math.round(((offset + LIKE_CHUNK_SIZE) / TOTAL_LIKES) * 100)}%)\r`);
  }
  console.log(`\n✅ [Likes] ${TOTAL_LIKES.toLocaleString()} post likes dual-persisted successfully.\n`);

  // ─────────────────────────────────────────────────────────────
  // 5. UPDATE DENORMALIZED COUNTERS (like_count, comment_count)
  // ─────────────────────────────────────────────────────────────
  console.log('[Post-Processing] Synchronizing post comment_count and like_count aggregations...');

  // Update in PostgreSQL
  await query(`
    UPDATE posts p
    SET 
      comment_count = sub.c_count,
      like_count = sub.l_count
    FROM (
      SELECT 
        p_inner.id,
        COALESCE(c.cnt, 0) AS c_count,
        COALESCE(l.cnt, 0) AS l_count
      FROM posts p_inner
      LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM comments GROUP BY post_id) c ON c.post_id = p_inner.id
      LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM post_likes GROUP BY post_id) l ON l.post_id = p_inner.id
    ) sub
    WHERE p.id = sub.id;
  `);

  // Also sync counts in MongoDB for top 1000 sample posts
  const topPgCounts = await query('SELECT id, like_count, comment_count FROM posts LIMIT 2000;');
  const bulkMongoUpdates = topPgCounts.rows.map((r) => ({
    updateOne: {
      filter: { _id: r.id },
      update: { $set: { likeCount: r.like_count, commentCount: r.comment_count } },
    },
  }));
  if (bulkMongoUpdates.length > 0) {
    await mongoDb.collection('posts').bulkWrite(bulkMongoUpdates);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. RECORD BENCHMARK METRIC & REPORT
  // ─────────────────────────────────────────────────────────────
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const pgStats = await query(`
    SELECT 
      (SELECT COUNT(*) FROM posts) AS total_posts,
      (SELECT COUNT(*) FROM comments) AS total_comments,
      (SELECT COUNT(*) FROM post_likes) AS total_likes,
      (SELECT pg_size_pretty(pg_total_relation_size('posts') + pg_total_relation_size('comments') + pg_total_relation_size('post_likes'))) AS pg_storage_size;
  `);

  const mongoPostCount = await mongoDb.collection('posts').countDocuments();
  const mongoCommentCount = await mongoDb.collection('comments').countDocuments();
  const mongoLikeCount = await mongoDb.collection('post_likes').countDocuments();

  console.log('\n================================================================');
  console.log('🎉 SEEDING COMPLETED IN ' + durationSec + ' SECONDS!');
  console.log('================================================================');
  console.log('📊 POSTGRESQL (3NF Relational Store):');
  console.log(`   - Posts:     ${Number(pgStats.rows[0].total_posts).toLocaleString()}`);
  console.log(`   - Comments:  ${Number(pgStats.rows[0].total_comments).toLocaleString()}`);
  console.log(`   - Likes:     ${Number(pgStats.rows[0].total_likes).toLocaleString()}`);
  console.log(`   - Disk Size: ${pgStats.rows[0].pg_storage_size}`);
  console.log('🍃 MONGODB (NoSQL Document Store):');
  console.log(`   - Posts:     ${mongoPostCount.toLocaleString()}`);
  console.log(`   - Comments:  ${mongoCommentCount.toLocaleString()}`);
  console.log(`   - Likes:     ${mongoLikeCount.toLocaleString()}`);
  console.log('================================================================\n');

  await pool.end();
  await closeMongo();
  process.exit(0);
}

seedBenchmarkData().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
