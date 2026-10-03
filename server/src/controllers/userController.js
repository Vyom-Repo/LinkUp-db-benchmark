const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');

// 1. GET USER PROFILE WITH REAL CALCULATED STATS AND POSTS
async function getProfile(req, res) {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;
    const cleanUsername = username.trim().toLowerCase();

    // Query User Details from PostgreSQL
    const userSql = `
      SELECT id, name, username, email, bio, avatar_url, is_admin, created_at
      FROM users
      WHERE LOWER(username) = $1
      LIMIT 1;
    `;
    const userRes = await query(userSql, [cleanUsername]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `User @${username} not found.` },
      });
    }

    const targetUser = userRes.rows[0];
    const isOwnProfile = currentUserId === targetUser.id;

    // Calculate Real Aggregated Statistics
    const statsSql = `
      SELECT
        (SELECT COUNT(*)::int FROM posts WHERE author_id = $1) AS post_count,
        (SELECT COUNT(*)::int FROM comments WHERE author_id = $1) AS comment_count,
        (SELECT COALESCE(SUM(like_count), 0)::int FROM posts WHERE author_id = $1) AS likes_received;
    `;
    const statsRes = await query(statsSql, [targetUser.id]);
    const stats = statsRes.rows[0] || { post_count: 0, comment_count: 0, likes_received: 0 };

    // Fetch Target User's Posts (Ordered by newest first)
    const postsSql = `
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
          WHERE pl.post_id = p.id AND pl.user_id = $2
        ) AS is_liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC;
    `;
    const postsRes = await query(postsSql, [targetUser.id, currentUserId || null]);

    // Redact email for other users' profiles (Privacy protection)
    const profileData = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
      email: isOwnProfile ? targetUser.email : undefined,
      bio: targetUser.bio || '',
      avatar_url: targetUser.avatar_url,
      created_at: targetUser.created_at,
      stats: {
        posts: stats.post_count,
        comments: stats.comment_count,
        likes_received: stats.likes_received,
      },
      is_own_profile: isOwnProfile,
      posts: postsRes.rows,
    };

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.json({
      success: true,
      data: profileData,
    });
  } catch (err) {
    console.error('[getProfile Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve profile.' },
    });
  }
}

// 2. UPDATE PROFILE (DUAL-WRITE to PostgreSQL and MongoDB)
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, bio, avatarUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name cannot be empty.' },
      });
    }

    const cleanName = name.trim();
    const cleanBio = bio !== undefined ? bio.trim() : '';
    const cleanAvatar = avatarUrl !== undefined ? (avatarUrl.trim() || null) : undefined;
    const now = new Date();

    // A. Update in PostgreSQL
    const pgSql = `
      UPDATE users 
      SET 
        name = $1,
        bio = $2,
        avatar_url = COALESCE($3, avatar_url),
        updated_at = $4
      WHERE id = $5
      RETURNING id, name, username, email, bio, avatar_url, is_admin, created_at;
    `;
    const pgRes = await query(pgSql, [cleanName, cleanBio, cleanAvatar, now, userId]);

    if (pgRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    const updatedUser = pgRes.rows[0];

    // B. Update in MongoDB
    const mongoDb = getMongoDb();
    const mongoUpdate = {
      name: cleanName,
      bio: cleanBio,
      updatedAt: now,
    };
    if (cleanAvatar !== undefined) {
      mongoUpdate.avatarUrl = cleanAvatar;
    }

    await mongoDb.collection('users').updateOne(
      { _id: userId },
      { $set: mongoUpdate }
    );

    console.log(`[Dual-Write User] Profile for @${updatedUser.username} updated in BOTH PostgreSQL and MongoDB.`);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatar_url,
          isAdmin: updatedUser.is_admin,
          createdAt: updatedUser.created_at,
        },
      },
    });
  } catch (err) {
    console.error('[updateProfile Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile.' },
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
