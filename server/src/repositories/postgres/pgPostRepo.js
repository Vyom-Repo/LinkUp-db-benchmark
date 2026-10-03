const { query } = require('../../config/postgres');

class PgPostRepository {
  async create({ id, authorId, content }) {
    const sql = `
      INSERT INTO posts (id, author_id, content, like_count, comment_count, created_at, updated_at)
      VALUES ($1, $2, $3, 0, 0, NOW(), NOW())
      RETURNING id, author_id, content, like_count, comment_count, created_at, updated_at;
    `;
    const res = await query(sql, [id, authorId, content]);
    return res.rows[0];
  }

  async findById(id) {
    const sql = `
      SELECT 
        p.id, p.content, p.like_count, p.comment_count, p.created_at, p.updated_at,
        p.author_id, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  async getFeed({ limit = 20, offset = 0, sort = 'latest' } = {}) {
    let orderBy = 'p.created_at DESC';
    if (sort === 'liked') {
      orderBy = 'p.like_count DESC, p.created_at DESC';
    } else if (sort === 'commented') {
      orderBy = 'p.comment_count DESC, p.created_at DESC';
    }

    const sql = `
      SELECT 
        p.id, p.content, p.like_count, p.comment_count, p.created_at, p.updated_at,
        p.author_id, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2;
    `;
    const res = await query(sql, [limit, offset]);
    return res.rows;
  }

  async getByAuthorId({ authorId, limit = 20, offset = 0 } = {}) {
    const sql = `
      SELECT 
        p.id, p.content, p.like_count, p.comment_count, p.created_at, p.updated_at,
        p.author_id, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await query(sql, [authorId, limit, offset]);
    return res.rows;
  }

  async update({ id, authorId, content }) {
    const sql = `
      UPDATE posts
      SET content = $1, updated_at = NOW()
      WHERE id = $2 AND author_id = $3
      RETURNING id, author_id, content, like_count, comment_count, created_at, updated_at;
    `;
    const res = await query(sql, [content, id, authorId]);
    return res.rows[0] || null;
  }

  async delete({ id, authorId, isAdmin = false }) {
    let sql;
    let params;
    if (isAdmin) {
      sql = `DELETE FROM posts WHERE id = $1 RETURNING id;`;
      params = [id];
    } else {
      sql = `DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING id;`;
      params = [id, authorId];
    }
    const res = await query(sql, params);
    return res.rowCount > 0;
  }

  async search({ queryText, limit = 20, offset = 0 } = {}) {
    const sql = `
      SELECT 
        p.id, p.content, p.like_count, p.comment_count, p.created_at, p.updated_at,
        p.author_id, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar,
        ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, p.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await query(sql, [queryText, limit, offset]);
    return res.rows;
  }

  async count() {
    const sql = `SELECT COUNT(*)::int as count FROM posts;`;
    const res = await query(sql);
    return res.rows[0].count;
  }

  async getTopEngaged(limit = 5) {
    const sql = `
      SELECT 
        p.id, p.content, p.like_count, p.comment_count, p.created_at,
        u.username as author_username
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY (p.like_count + p.comment_count) DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows;
  }
}

module.exports = new PgPostRepository();
