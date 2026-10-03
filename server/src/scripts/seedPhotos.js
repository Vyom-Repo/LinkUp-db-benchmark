const crypto = require('crypto');
const { pool, query } = require('../config/postgres');
const { connectMongo, closeMongo } = require('../config/mongodb');

const PHOTO_POSTS = [
  {
    content: 'Golden hour reflections on contemporary architectural geometry. Finding symmetry in modern urban spaces.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
    likes: 142,
    comments: [
      { author: 'User 12', username: 'user_12', text: 'Incredible lighting! Where was this taken?' },
      { author: 'User 25', username: 'user_25', text: 'The composition and lines are stunning.' },
    ],
  },
  {
    content: 'Morning espresso and deep focus. Designing distributed data models that scale effortlessly.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80',
    likes: 98,
    comments: [
      { author: 'User 30', username: 'user_30', text: 'Coffee + code is the ultimate combination ☕' },
    ],
  },
  {
    content: 'Minimalist interior textures and natural midday warmth. Keeping the creative workspace calm.',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1000&auto=format&fit=crop&q=80',
    likes: 215,
    comments: [
      { author: 'User 4', username: 'user_4', text: 'Such clean aesthetic vibes!' },
    ],
  },
  {
    content: 'Dusk settling over the skyline. Fast city, fast networks, zero latency.',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1000&auto=format&fit=crop&q=80',
    likes: 180,
    comments: [
      { author: 'User 8', username: 'user_8', text: 'Stunning city view.' },
    ],
  },
  {
    content: 'Ocean horizon at low tide. Nature reminding us about the beauty of fluid balance.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    likes: 310,
    comments: [
      { author: 'User 19', username: 'user_19', text: 'Peaceful and serene.' },
    ],
  },
];

async function seedPhotos() {
  console.log('[Photos] Seeding Instagram-style demo photo posts into PostgreSQL and MongoDB...');
  await query('SELECT 1');
  const mongoDb = await connectMongo();

  // Fetch some real users to associate as authors
  const userRes = await query('SELECT id, name, username FROM users LIMIT 10;');
  const authors = userRes.rows;

  if (authors.length === 0) {
    console.log('No authors found, run seeder first.');
    return;
  }

  for (let i = 0; i < PHOTO_POSTS.length; i++) {
    const item = PHOTO_POSTS[i];
    const author = authors[i % authors.length];
    const postId = crypto.randomUUID();
    const createdAt = new Date(Date.now() - (i + 1) * 3600000);

    // 1. Insert into PostgreSQL
    await query(
      `INSERT INTO posts (id, author_id, content, image_url, like_count, comment_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING;`,
      [postId, author.id, item.content, item.imageUrl, item.likes, item.comments.length, createdAt, createdAt]
    );

    // 2. Insert into MongoDB
    await mongoDb.collection('posts').updateOne(
      { _id: postId },
      {
        $set: {
          authorId: author.id,
          content: item.content,
          imageUrl: item.imageUrl,
          likeCount: item.likes,
          commentCount: item.comments.length,
          createdAt,
          updatedAt: createdAt,
        },
      },
      { upsert: true }
    );

    // Comments
    for (const c of item.comments) {
      const commentId = crypto.randomUUID();
      const commentAuthor = authors[(i + 1) % authors.length];

      await query(
        `INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`,
        [commentId, postId, commentAuthor.id, c.text]
      );

      await mongoDb.collection('comments').updateOne(
        { _id: commentId },
        {
          $set: {
            postId,
            authorId: commentAuthor.id,
            content: c.text,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  console.log('✅ Instagram-style photo posts seeded into both databases!');
  await pool.end();
  await closeMongo();
}

seedPhotos().catch(console.error);
