const { query } = require('../../config/postgres');

class PgUserRepository {
  async findById(id) {
    const sql = `
      SELECT id, name, username, email, bio, avatar_url, is_admin, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  async findByEmail(email) {
    const sql = `
      SELECT id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const res = await query(sql, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  async findByUsername(username) {
    const sql = `
      SELECT id, name, username, email, bio, avatar_url, is_admin, created_at, updated_at
      FROM users
      WHERE username = $1;
    `;
    const res = await query(sql, [username.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  async create({ id, name, username, email, passwordHash, bio = '', avatarUrl = '', isAdmin = false }) {
    const sql = `
      INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, name, username, email, bio, avatar_url, is_admin, created_at, updated_at;
    `;
    const res = await query(sql, [
      id,
      name.trim(),
      username.toLowerCase().trim(),
      email.toLowerCase().trim(),
      passwordHash,
      bio,
      avatarUrl,
      isAdmin,
    ]);
    return res.rows[0];
  }

  async count() {
    const sql = `SELECT COUNT(*)::int as count FROM users;`;
    const res = await query(sql);
    return res.rows[0].count;
  }
}

module.exports = new PgUserRepository();
