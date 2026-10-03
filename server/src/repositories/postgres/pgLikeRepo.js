const { query } = require('../../config/postgres');

class PgLikeRepository {
  async addLike({ postId, userId }) {
    const sql = `
      INSERT INTO post_likes (post_id, user_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING post_id, user_id, created_at;
    `;
    const res = await query(sql, [postId, userId]);
    // If rowCount > 0, like was successfully inserted (trigger updated posts.like_count)
    return {
      liked: true,
      alreadyLiked: res.rowCount === 0,
    };
  }

  async removeLike({ postId, userId }) {
    const sql = `
      DELETE FROM post_likes
      WHERE post_id = $1 AND user_id = $2
      RETURNING post_id, user_id;
    `;
    const res = await query(sql, [postId, userId]);
    return {
      liked: false,
      wasLiked: res.rowCount > 0,
    };
  }

  async hasLiked({ postId, userId }) {
    const sql = `
      SELECT 1 FROM post_likes
      WHERE post_id = $1 AND user_id = $2;
    `;
    const res = await query(sql, [postId, userId]);
    return res.rowCount > 0;
  }

  async getLikedPostIdsByUser({ userId, postIds = [] }) {
    if (postIds.length === 0) return [];
    const sql = `
      SELECT post_id
      FROM post_likes
      WHERE user_id = $1 AND post_id = ANY($2::uuid[]);
    `;
    const res = await query(sql, [userId, postIds]);
    return res.rows.map((r) => r.post_id);
  }

  async count() {
    const sql = `SELECT COUNT(*)::int as count FROM post_likes;`;
    const res = await query(sql);
    return res.rows[0].count;
  }
}

module.exports = new PgLikeRepository();
