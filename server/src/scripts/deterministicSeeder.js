const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/postgres');
const { connectMongo, getDb, closeMongo } = require('../config/mongodb');

/**
 * Deterministic PRNG using Mulberry32 algorithm
 */
class DeterministicPRNG {
  constructor(seed = 1337) {
    this.seed = seed;
  }

  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice(arr) {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  uuid() {
    // Generate deterministic 36-character UUID v4 format
    const hex = [];
    for (let i = 0; i < 16; i++) {
      hex.push(this.nextInt(0, 255).toString(16).padStart(2, '0'));
    }
    hex[6] = (parseInt(hex[6], 16) & 0x0f | 0x40).toString(16).padStart(2, '0'); // v4
    hex[8] = (parseInt(hex[8], 16) & 0x3f | 0x80).toString(16).padStart(2, '0'); // variant
    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
  }
}

const TOPICS = [
  'database architectures', 'PostgreSQL indexing', 'MongoDB pipelines', 'relational joins',
  'NoSQL scalability', 'B-Tree performance', 'full-text search', 'ACID transactions',
  'distributed systems', 'web application development', 'RESTful API design', 'React optimization'
];

const WORDS = [
  'scalable', 'high-throughput', 'latency', 'benchmark', 'concurrency', 'optimization',
  'normalized', 'unindexed', 'query', 'execution', 'buffer', 'cache', 'throughput',
  'efficient', 'relational', 'document', 'partitioning', 'sharding', 'indexes'
];

const generatePostText = (prng) => {
  const topic = prng.choice(TOPICS);
  const w1 = prng.choice(WORDS);
  const w2 = prng.choice(WORDS);
  const w3 = prng.choice(WORDS);
  return `Analyzing ${topic} for modern cloud workloads. Demonstrating ${w1} and ${w2} metrics under intensive ${w3} testing.`;
};

const generateCommentText = (prng) => {
  const compliments = ['Very insightful analysis on', 'Impressive performance metrics regarding', 'Interesting observation about'];
  return `${prng.choice(compliments)} ${prng.choice(TOPICS)}! The results align with expected execution plans.`;
};

/**
 * Deterministic Seeder Main
 */
const runDeterministicSeeder = async () => {
  const args = process.argv.slice(2);
  let scaleArg = args.find((a) => a.startsWith('--scale='));
  const targetPostCount = scaleArg ? parseInt(scaleArg.split('=')[1], 10) : 1000;

  console.log(`\n======================================================`);
  console.log(`🌱 Sync Deterministic Seed Generator`);
  console.log(`Target Posts:   ${targetPostCount.toLocaleString()}`);
  console.log(`PRNG Seed:      1337 (Fixed reproducibility)`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  const prng = new DeterministicPRNG(1337);

  // Initialize DB connections
  await query('SELECT 1');
  const mongoDb = await connectMongo();

  // Clean existing non-admin data
  console.log('[Cleanup] Wiping non-admin data for fresh deterministic baseline...');
  await query("DELETE FROM post_likes;");
  await query("DELETE FROM comments;");
  await query("DELETE FROM posts;");
  await query("DELETE FROM users WHERE username != 'admin';");

  await mongoDb.collection('post_likes').deleteMany({});
  await mongoDb.collection('comments').deleteMany({});
  await mongoDb.collection('posts').deleteMany({});
  await mongoDb.collection('users').deleteMany({ username: { $ne: 'admin' } });

  // 1. Generate Deterministic Users (Target: 1 user per 10 posts, min 20, max 2,000)
  const userCount = Math.max(20, Math.min(2000, Math.floor(targetPostCount / 10)));
  console.log(`[Users] Generating ${userCount} deterministic test users...`);

  // Shared fixed bcrypt hash for 'Password123!'
  const sampleHash = '$2b$10$wKz0b/rUvhw2VepwS6L1cOfuXnL9w9oI7yT9vV.L.rSj6u5c3o0.q';
  const users = [];

  for (let i = 1; i <= userCount; i++) {
    const id = prng.uuid();
    const user = {
      id,
      name: `User ${i}`,
      username: `user_${i}`,
      email: `user_${i}@sync.local`,
      passwordHash: sampleHash,
      bio: `Software engineer #${i} studying advanced database management systems.`,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=user_${i}`,
      isAdmin: false,
      createdAt: new Date(1700000000000 + i * 60000),
      updatedAt: new Date(1700000000000 + i * 60000),
    };
    users.push(user);
  }

  // Insert Users into Postgres
  const pgUserValues = users.map((u) => 
    `('${u.id}', '${u.name}', '${u.username}', '${u.email}', '${u.passwordHash}', '${u.bio}', '${u.avatarUrl}', false, '${u.createdAt.toISOString()}', '${u.updatedAt.toISOString()}')`
  ).join(',');
  await query(`INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at) VALUES ${pgUserValues};`);

  // Insert Users into MongoDB
  const mongoUsers = users.map((u) => ({
    _id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    passwordHash: u.passwordHash,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    isAdmin: false,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
  await mongoDb.collection('users').insertMany(mongoUsers, { ordered: false });
  console.log(`[Users] ✅ ${userCount} users written identically to Postgres & MongoDB.`);

  // 2. Stream Posts in batches of 2,000
  const BATCH_SIZE = 2000;
  let postsRemaining = targetPostCount;
  let postIndex = 0;
  const allPostIds = [];
  const postCommentsMap = new Map(); // Store post to comment links

  console.log(`[Posts] Streaming ${targetPostCount} deterministic posts in chunks of ${BATCH_SIZE}...`);

  while (postsRemaining > 0) {
    const currentBatchSize = Math.min(BATCH_SIZE, postsRemaining);
    const pgPostRows = [];
    const mongoPosts = [];

    for (let b = 0; b < currentBatchSize; b++) {
      postIndex++;
      const postId = prng.uuid();
      allPostIds.push(postId);
      const author = prng.choice(users);
      const content = generatePostText(prng);
      const createdAt = new Date(1700100000000 + postIndex * 30000);

      // We'll calculate comments & likes subsequently
      pgPostRows.push(
        `('${postId}', '${author.id}', '${content.replace(/'/g, "''")}', 0, 0, '${createdAt.toISOString()}', '${createdAt.toISOString()}')`
      );

      mongoPosts.push({
        _id: postId,
        authorId: author.id,
        content,
        likeCount: 0,
        commentCount: 0,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Insert batch into Postgres
    await query(`INSERT INTO posts (id, author_id, content, like_count, comment_count, created_at, updated_at) VALUES ${pgPostRows.join(',')};`);

    // Insert batch into MongoDB
    await mongoDb.collection('posts').insertMany(mongoPosts, { ordered: false });

    postsRemaining -= currentBatchSize;
    process.stdout.write(`\r[Posts] Written ${postIndex} / ${targetPostCount} posts...`);
  }
  console.log(`\n[Posts] ✅ ${targetPostCount} posts written identically to Postgres & MongoDB.`);

  // 3. Generate Comments (approx 2 comments per post)
  const targetCommentCount = Math.floor(targetPostCount * 2);
  console.log(`[Comments] Streaming ${targetCommentCount} deterministic comments in chunks of ${BATCH_SIZE}...`);
  let commentsRemaining = targetCommentCount;
  let commentIndex = 0;

  while (commentsRemaining > 0) {
    const currentBatchSize = Math.min(BATCH_SIZE, commentsRemaining);
    const pgCommentRows = [];
    const mongoComments = [];

    for (let b = 0; b < currentBatchSize; b++) {
      commentIndex++;
      const commentId = prng.uuid();
      const targetPostId = prng.choice(allPostIds);
      const author = prng.choice(users);
      const content = generateCommentText(prng);
      const createdAt = new Date(1700200000000 + commentIndex * 15000);

      pgCommentRows.push(
        `('${commentId}', '${targetPostId}', '${author.id}', '${content.replace(/'/g, "''")}', '${createdAt.toISOString()}', '${createdAt.toISOString()}')`
      );

      mongoComments.push({
        _id: commentId,
        postId: targetPostId,
        authorId: author.id,
        content,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Insert into Postgres (Trigger will automatically maintain posts.comment_count!)
    await query(`INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at) VALUES ${pgCommentRows.join(',')};`);

    // Insert into MongoDB
    await mongoDb.collection('comments').insertMany(mongoComments, { ordered: false });

    commentsRemaining -= currentBatchSize;
    process.stdout.write(`\r[Comments] Written ${commentIndex} / ${targetCommentCount} comments...`);
  }
  console.log(`\n[Comments] ✅ ${targetCommentCount} comments written identically.`);

  // Synchronize MongoDB post commentCount to match Postgres trigger counts
  console.log('[Comments] Synchronizing MongoDB post comment counts...');
  await mongoDb.collection('comments').aggregate([
    { $group: { _id: '$postId', count: { $sum: 1 } } }
  ]).forEach(async (doc) => {
    await mongoDb.collection('posts').updateOne(
      { _id: doc._id },
      { $set: { commentCount: doc.count } }
    );
  });

  // 4. Generate Likes (approx 3 likes per post)
  const targetLikeCount = Math.floor(targetPostCount * 3);
  console.log(`[Likes] Generating ${targetLikeCount} deterministic likes...`);
  const uniqueLikeSet = new Set();
  const likes = [];

  while (likes.length < targetLikeCount) {
    const postId = prng.choice(allPostIds);
    const user = prng.choice(users);
    const key = `${postId}:${user.id}`;
    if (!uniqueLikeSet.has(key)) {
      uniqueLikeSet.add(key);
      likes.push({ postId, userId: user.id, createdAt: new Date() });
    }
  }

  // Stream likes in batches
  for (let i = 0; i < likes.length; i += BATCH_SIZE) {
    const chunk = likes.slice(i, i + BATCH_SIZE);
    const pgRows = chunk.map((l) => `('${l.postId}', '${l.userId}', '${l.createdAt.toISOString()}')`);
    await query(`INSERT INTO post_likes (post_id, user_id, created_at) VALUES ${pgRows.join(',')} ON CONFLICT DO NOTHING;`);

    const mongoDocs = chunk.map((l) => ({
      _id: `${l.postId}_${l.userId}`,
      postId: l.postId,
      userId: l.userId,
      createdAt: l.createdAt,
    }));
    try {
      await mongoDb.collection('post_likes').insertMany(mongoDocs, { ordered: false });
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Synchronize MongoDB post likeCount to match Postgres trigger counts
  console.log('[Likes] Synchronizing MongoDB post like counts...');
  await mongoDb.collection('post_likes').aggregate([
    { $group: { _id: '$postId', count: { $sum: 1 } } }
  ]).forEach(async (doc) => {
    await mongoDb.collection('posts').updateOne(
      { _id: doc._id },
      { $set: { likeCount: doc.count } }
    );
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🎉 Seeding Complete in ${durationSec}s!`);
  console.log(`PostgreSQL Counts:`);
  const pgUsers = await query('SELECT count(*)::int from users;');
  const pgPosts = await query('SELECT count(*)::int from posts;');
  const pgComments = await query('SELECT count(*)::int from comments;');
  const pgLikes = await query('SELECT count(*)::int from post_likes;');
  console.log(`  Users:      ${pgUsers.rows[0].count}`);
  console.log(`  Posts:      ${pgPosts.rows[0].count}`);
  console.log(`  Comments:   ${pgComments.rows[0].count}`);
  console.log(`  Likes:      ${pgLikes.rows[0].count}`);

  console.log(`MongoDB Counts:`);
  console.log(`  Users:      ${await mongoDb.collection('users').countDocuments()}`);
  console.log(`  Posts:      ${await mongoDb.collection('posts').countDocuments()}`);
  console.log(`  Comments:   ${await mongoDb.collection('comments').countDocuments()}`);
  console.log(`  Likes:      ${await mongoDb.collection('post_likes').countDocuments()}`);
  console.log(`======================================================\n`);
};

runDeterministicSeeder()
  .catch((err) => {
    console.error('❌ Seeder failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    await closeMongo();
  });
