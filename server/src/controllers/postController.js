const crypto = require('crypto');
const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');

// 1. GET FEED POSTS (WITH AUTHOR & LIKE STATUS)
async function getFeed(req, res) {
  try {
    const currentUserId = req.user?.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        p.id,
        p.author_id,
        p.content,
        p.image_url,
        p.like_count,
        p.comment_count,
        p.created_at,
        u.name AS author_name,
        u.username AS author_username,
        u.avatar_url AS author_avatar,
        EXISTS(
          SELECT 1 FROM post_likes pl 
          WHERE pl.post_id = p.id AND pl.user_id = $1
        ) AS is_liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await query(sql, [currentUserId || null, limit, offset]);

    return res.json({
      success: true,
      data: {
        posts: result.rows,
        page,
        limit,
      },
    });
  } catch (err) {
    console.error('[getFeed Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to load feed posts.' },
    });
  }
}

// 2. CREATE NEW POST (DUAL-WRITE to PostgreSQL and MongoDB)
async function createPost(req, res) {
  try {
    const authorId = req.user.id;
    const { content, imageUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Post content cannot be empty.' },
      });
    }

    const postId = crypto.randomUUID();
    const cleanContent = content.trim();
    const cleanImageUrl = imageUrl ? imageUrl.trim() : null;
    const now = new Date();

    // A. PostgreSQL
    await query(
      `INSERT INTO posts (id, author_id, content, image_url, like_count, comment_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, 0, $5, $5);`,
      [postId, authorId, cleanContent, cleanImageUrl, now]
    );

    // B. MongoDB
    const mongoDb = getMongoDb();
    await mongoDb.collection('posts').insertOne({
      _id: postId,
      id: postId,
      authorId,
      content: cleanContent,
      imageUrl: cleanImageUrl,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch author details for immediate client display
    const userRes = await query('SELECT name, username, avatar_url FROM users WHERE id = $1', [authorId]);
    const author = userRes.rows[0] || {};

    const postPayload = {
      id: postId,
      author_id: authorId,
      content: cleanContent,
      image_url: cleanImageUrl,
      like_count: 0,
      comment_count: 0,
      created_at: now.toISOString(),
      author_name: author.name || req.user.name,
      author_username: author.username || req.user.username,
      author_avatar: author.avatar_url || null,
      is_liked_by_me: false,
    };

    return res.status(201).json({
      success: true,
      data: { post: postPayload },
    });
  } catch (err) {
    console.error('[createPost Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to publish post.' },
    });
  }
}

// 3. TOGGLE LIKE (DUAL-WRITE to post_likes in both databases)
async function toggleLike(req, res) {
  try {
    const userId = req.user.id;
    const { id: postId } = req.params;

    // Check if like exists in PostgreSQL
    const existing = await query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2;',
      [postId, userId]
    );

    const mongoDb = getMongoDb();

    if (existing.rows.length > 0) {
      // UNLIKE
      await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2;', [postId, userId]);
      await query('UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1;', [postId]);

      await mongoDb.collection('post_likes').deleteOne({ postId, userId });
      await mongoDb.collection('posts').updateOne({ _id: postId }, { $inc: { likeCount: -1 } });

      const countRes = await query('SELECT like_count FROM posts WHERE id = $1;', [postId]);
      return res.json({
        success: true,
        data: {
          liked: false,
          likeCount: countRes.rows[0]?.like_count ?? 0,
        },
      });
    } else {
      // LIKE
      const likeId = crypto.randomUUID();
      const now = new Date();

      await query(
        'INSERT INTO post_likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4);',
        [likeId, postId, userId, now]
      );
      await query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1;', [postId]);

      await mongoDb.collection('post_likes').insertOne({
        _id: likeId,
        id: likeId,
        postId,
        userId,
        createdAt: now,
      });
      await mongoDb.collection('posts').updateOne({ _id: postId }, { $inc: { likeCount: 1 } });

      const countRes = await query('SELECT like_count FROM posts WHERE id = $1;', [postId]);
      return res.json({
        success: true,
        data: {
          liked: true,
          likeCount: countRes.rows[0]?.like_count ?? 1,
        },
      });
    }
  } catch (err) {
    console.error('[toggleLike Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update like status.' },
    });
  }
}

// 4. GET COMMENTS FOR A POST
async function getComments(req, res) {
  try {
    const { id: postId } = req.params;

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
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC;
    `;

    const result = await query(sql, [postId]);

    return res.json({
      success: true,
      data: { comments: result.rows },
    });
  } catch (err) {
    console.error('[getComments Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to load comments.' },
    });
  }
}

// 5. ADD INLINE COMMENT (DUAL-WRITE)
async function addComment(req, res) {
  try {
    const authorId = req.user.id;
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment text cannot be empty.' },
      });
    }

    const commentId = crypto.randomUUID();
    const cleanContent = content.trim();
    const now = new Date();

    // A. PostgreSQL
    await query(
      `INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5);`,
      [commentId, postId, authorId, cleanContent, now]
    );
    await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1;', [postId]);

    // B. MongoDB
    const mongoDb = getMongoDb();
    await mongoDb.collection('comments').insertOne({
      _id: commentId,
      id: commentId,
      postId,
      authorId,
      content: cleanContent,
      createdAt: now,
      updatedAt: now,
    });
    await mongoDb.collection('posts').updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

    // Fetch author info
    const userRes = await query('SELECT name, username, avatar_url FROM users WHERE id = $1', [authorId]);
    const author = userRes.rows[0] || {};

    const commentPayload = {
      id: commentId,
      post_id: postId,
      author_id: authorId,
      content: cleanContent,
      created_at: now.toISOString(),
      author_name: author.name || req.user.name,
      author_username: author.username || req.user.username,
      author_avatar: author.avatar_url || null,
    };

    return res.status(201).json({
      success: true,
      data: { comment: commentPayload },
    });
  } catch (err) {
    console.error('[addComment Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to post comment.' },
    });
  }
}

module.exports = {
  getFeed,
  createPost,
  toggleLike,
  getComments,
  addComment,
};
