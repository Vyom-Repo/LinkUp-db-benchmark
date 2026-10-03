const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');
const { getActiveEngine } = require('../config/engineState');

// 1. GET COMMENTS FOR A POST
async function getComments(postId) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const docs = await mongoDb.collection('comments').aggregate([
      { $match: { postId } },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    const t1 = performance.now();
    const comments = docs.map(d => ({
      id: d._id.toString(),
      post_id: d.postId,
      author_id: d.authorId,
      content: d.content,
      created_at: d.createdAt,
      author_name: d.author?.name || 'Community Member',
      author_username: d.author?.username || 'user',
      author_avatar: d.author?.avatarUrl || null
    }));

    return {
      comments,
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  const sql = `
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.content,
      c.created_at,
      u.name AS author_name,
      u.username AS author_username,
      u.avatar_url AS author_avatar
    FROM comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = $1::uuid
    ORDER BY c.created_at ASC;
  `;
  const result = await query(sql, [postId]);
  const t1 = performance.now();

  return {
    comments: result.rows,
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 2. ADD COMMENT (EXCLUSIVELY TO ACTIVE ENGINE)
async function addComment({ id, postId, authorId, content, createdAt = new Date() }) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    await mongoDb.collection('comments').insertOne({
      _id: id,
      id,
      postId,
      authorId,
      content,
      createdAt,
      updatedAt: createdAt
    });

    await mongoDb.collection('posts').updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 } }
    );

    const authorDoc = await mongoDb.collection('users').findOne({ _id: authorId });
    const t1 = performance.now();

    return {
      comment: {
        id,
        post_id: postId,
        author_id: authorId,
        content,
        created_at: createdAt.toISOString(),
        author_name: authorDoc?.name || 'User',
        author_username: authorDoc?.username || 'user',
        author_avatar: authorDoc?.avatarUrl || null
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  await query(
    `INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5);`,
    [id, postId, authorId, content, createdAt]
  );
  await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1;', [postId]);

  const userRes = await query('SELECT name, username, avatar_url FROM users WHERE id = $1;', [authorId]);
  const author = userRes.rows[0] || {};
  const t1 = performance.now();

  return {
    comment: {
      id,
      post_id: postId,
      author_id: authorId,
      content,
      created_at: createdAt.toISOString(),
      author_name: author.name || 'User',
      author_username: author.username || 'user',
      author_avatar: author.avatar_url || null
    },
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 3. DELETE COMMENT (EXCLUSIVELY FROM ACTIVE ENGINE)
async function deleteComment(commentId, userId, isAdmin = false) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const comment = await mongoDb.collection('comments').findOne({ _id: commentId });
    if (!comment) return { notFound: true };
    if (comment.authorId !== userId && !isAdmin) return { forbidden: true };

    await mongoDb.collection('comments').deleteOne({ _id: commentId });
    await mongoDb.collection('posts').updateOne(
      { _id: comment.postId },
      { $inc: { commentCount: -1 } }
    );
    const t1 = performance.now();

    return {
      success: true,
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  const checkRes = await query('SELECT author_id, post_id FROM comments WHERE id = $1;', [commentId]);
  if (checkRes.rows.length === 0) return { notFound: true };
  if (checkRes.rows[0].author_id !== userId && !isAdmin) return { forbidden: true };

  const postId = checkRes.rows[0].post_id;
  await query('DELETE FROM comments WHERE id = $1;', [commentId]);
  await query('UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1;', [postId]);
  const t1 = performance.now();

  return {
    success: true,
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

module.exports = {
  getComments,
  addComment,
  deleteComment
};
