const crypto = require('crypto');
const { pool, query } = require('../config/postgres');
const { connectMongo, closeMongo } = require('../config/mongodb');

const SAMPLE_POSTS = [
  {
    content: 'Sunset over the university campus clocktower after a long day of distributed database lectures. Finding calm in architecture.',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&auto=format&fit=crop&q=80',
    likes: 42,
    comments: [
      { text: 'Incredible lighting! GTU campus looks stunning at dusk.' },
      { text: 'The composition is on point.' },
    ],
  },
  {
    content: 'Morning espresso and deep focus. Designing normalized 3NF schemas and comparing query plans with MongoDB.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80',
    likes: 88,
    comments: [
      { text: 'Coffee + SQL queries = peak productivity ☕' },
    ],
  },
  {
    content: 'Weekend study group at the library. Ready for the Web Application Development & ADBMS submission!',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
    likes: 115,
    comments: [
      { text: 'Good luck with the benchmark presentation!' },
      { text: 'Sync UI looks so clean and elegant.' },
    ],
  },
  {
    content: 'Minimalist desk setup with natural light. Keeping the workspace clean for high-focus coding sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1000&auto=format&fit=crop&q=80',
    likes: 64,
    comments: [
      { text: 'Love the aesthetic setup.' },
    ],
  },
];

async function seedSamplePosts() {
  console.log('[Seed] Seeding sample student posts into PostgreSQL and MongoDB...');
  const mongoDb = await connectMongo();

  // Get users to assign as authors
  const userRes = await query('SELECT id, name, username FROM users LIMIT 5;');
  const authors = userRes.rows;

  if (authors.length === 0) {
    console.log('No authors found. Please register a user first.');
    return;
  }

  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const item = SAMPLE_POSTS[i];
    const author = authors[i % authors.length];
    const postId = crypto.randomUUID();
    const createdAt = new Date(Date.now() - (i + 1) * 3600000 * 2);

    // 1. PostgreSQL Post
    await query(
      `INSERT INTO posts (id, author_id, content, image_url, like_count, comment_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING;`,
      [postId, author.id, item.content, item.imageUrl, item.likes, item.comments.length, createdAt, createdAt]
    );

    // 2. MongoDB Post
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
      const commentDate = new Date(Date.now() - (i + 1) * 1800000);

      await query(
        `INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (id) DO NOTHING;`,
        [commentId, postId, commentAuthor.id, c.text, commentDate]
      );

      await mongoDb.collection('comments').updateOne(
        { _id: commentId },
        {
          $set: {
            postId,
            authorId: commentAuthor.id,
            content: c.text,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        },
        { upsert: true }
      );
    }
  }

  console.log('✅ [Seed] Sample posts & comments seeded into both databases!');
  await pool.end();
  await closeMongo();
}

seedSamplePosts().catch(console.error);
