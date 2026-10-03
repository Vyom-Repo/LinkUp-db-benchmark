const crypto = require('crypto');
const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');
const { getActiveEngine } = require('../config/engineState');

// TOGGLE LIKE (EXCLUSIVELY ON ACTIVE ENGINE)
async function toggleLike(postId, userId) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const existing = await mongoDb.collection('post_likes').findOne({ postId, userId });

    if (existing) {
      // UNLIKE
      await mongoDb.collection('post_likes').deleteOne({ postId, userId });
      const updateRes = await mongoDb.collection('posts').findOneAndUpdate(
        { _id: postId },
        { $inc: { likeCount: -1 } },
        { returnDocument: 'after' }
      );
      const post = updateRes?.value || await mongoDb.collection('posts').findOne({ _id: postId });
      const t1 = performance.now();

      return {
        liked: false,
        likeCount: Math.max(0, post?.likeCount || 0),
        dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
        engine: 'MongoDB'
      };
    } else {
      // LIKE
      const likeId = crypto.randomUUID();
      const now = new Date();
      await mongoDb.collection('post_likes').insertOne({
        _id: likeId,
        id: likeId,
        postId,
        userId,
        createdAt: now
      });
      const updateRes = await mongoDb.collection('posts').findOneAndUpdate(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { returnDocument: 'after' }
      );
      const post = updateRes?.value || await mongoDb.collection('posts').findOne({ _id: postId });
      const t1 = performance.now();

      return {
        liked: true,
        likeCount: post?.likeCount || 1,
        dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
        engine: 'MongoDB'
      };
    }
  }

  // PostgreSQL Implementation
  const checkRes = await query(
    'SELECT id FROM post_likes WHERE post_id = $1::uuid AND user_id = $2::uuid;',
    [postId, userId]
  );

  if (checkRes.rows.length > 0) {
    // UNLIKE
    await query('DELETE FROM post_likes WHERE post_id = $1::uuid AND user_id = $2::uuid;', [postId, userId]);
    const updateRes = await query(
      'UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1::uuid RETURNING like_count;',
      [postId]
    );
    const t1 = performance.now();

    return {
      liked: false,
      likeCount: updateRes.rows[0]?.like_count ?? 0,
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'PostgreSQL'
    };
  } else {
    // LIKE
    const likeId = crypto.randomUUID();
    const now = new Date();
    await query(
      'INSERT INTO post_likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4);',
      [likeId, postId, userId, now]
    );
    const updateRes = await query(
      'UPDATE posts SET like_count = like_count + 1 WHERE id = $1::uuid RETURNING like_count;',
      [postId]
    );
    const t1 = performance.now();

    return {
      liked: true,
      likeCount: updateRes.rows[0]?.like_count ?? 1,
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'PostgreSQL'
    };
  }
}

module.exports = {
  toggleLike
};
