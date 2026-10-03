const { query } = require('../../config/postgres');

class PgCommentRepository {
  async create({ id, postId, authorId, content }) {
    const sql = `
      INSERT INTO comments (id, post_id, author_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, post_id, author_id, content, created_at, updated_at;
    `;
    const res = await query(sql, [id, postId, authorId, content]);
    return res.rows[0];
  }

  async findById(id) {
    const sql = `
      SELECT 
        c.id, c.post_id, c.author_id, c.content, c.created_at, c.updated_at,
        u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  async getByPostId({ postId, limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT 
        c.id, c.post_id, c.author_id, c.content, c.created_at, c.updated_at,
        u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3;
    `;
    const res = await query(sql, [postId, limit, offset]);
    return res.rows;
  }

  async delete({ id, authorId, isAdmin = false }) {
    let sql;
    let params;
    if (isAdmin) {
      sql = `DELETE FROM comments WHERE id = $1 RETURNING id, post_id;`;
      params = [id];
    } else {
      sql = `DELETE FROM comments WHERE id = $1 AND author_id = $2 RETURNING id, post_id;`;
      params = [id, authorId];
    }
    const res = await query(sql, params);
    return res.rowCount > 0;
  }

  async count() {
    const sql = `SELECT COUNT(*)::int as count FROM comments;`;
    const res = await query(sql);
    return res.rows[0].count;
  }
}

module.exports = new PgCommentRepository();
