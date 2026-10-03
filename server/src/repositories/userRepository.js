const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');
const { getActiveEngine } = require('../config/engineState');

// 1. GET USER BY ID (Used by /api/auth/me)
async function getUserById(userId) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const doc = await mongoDb.collection('users').findOne({
      $or: [{ _id: userId }, { id: userId }]
    });
    const t1 = performance.now();

    if (!doc) return { user: null, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'MongoDB' };

    return {
      user: {
        id: doc._id.toString(),
        name: doc.name,
        username: doc.username,
        email: doc.email,
        bio: doc.bio || '',
        avatarUrl: doc.avatarUrl || null,
        isAdmin: doc.isAdmin || false,
        createdAt: doc.createdAt
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  const sql = `
    SELECT id, name, username, email, bio, avatar_url, is_admin, created_at 
    FROM users 
    WHERE id = $1::uuid;
  `;
  const result = await query(sql, [userId]);
  const t1 = performance.now();

  if (result.rows.length === 0) {
    return { user: null, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'PostgreSQL' };
  }

  const row = result.rows[0];
  return {
    user: {
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      bio: row.bio || '',
      avatarUrl: row.avatar_url || null,
      isAdmin: row.is_admin || false,
      createdAt: row.created_at
    },
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 2. GET USER PROFILE (Used by /api/users/:username)
async function getProfile(username, currentUserId = null) {
  const activeEngine = getActiveEngine();
  const cleanUsername = (username || '').trim().toLowerCase();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const userDoc = await mongoDb.collection('users').findOne({
      username: { $regex: `^${cleanUsername}$`, $options: 'i' }
    });

    if (!userDoc) {
      const t1 = performance.now();
      return { notFound: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'MongoDB' };
    }

    const userId = userDoc._id.toString();
    const isOwnProfile = currentUserId === userId;

    // Parallel aggregate count/stats on MongoDB
    const [postCount, commentCount, likesAgg, rawPosts] = await Promise.all([
      mongoDb.collection('posts').countDocuments({ authorId: userId }),
      mongoDb.collection('comments').countDocuments({ authorId: userId }),
      mongoDb.collection('posts').aggregate([
        { $match: { authorId: userId } },
        { $group: { _id: null, totalLikes: { $sum: '$likeCount' } } }
      ]).toArray(),
      mongoDb.collection('posts').find({ authorId: userId }).sort({ createdAt: -1 }).toArray()
    ]);

    const likesReceived = likesAgg[0]?.totalLikes || 0;

    let likedSet = new Set();
    if (currentUserId && rawPosts.length > 0) {
      const postIds = rawPosts.map(p => p._id.toString());
      const likes = await mongoDb.collection('post_likes').find({
        postId: { $in: postIds },
        userId: currentUserId
      }).toArray();
      likedSet = new Set(likes.map(l => l.postId.toString()));
    }

    const t1 = performance.now();

    const formattedPosts = rawPosts.map(p => ({
      id: p._id.toString(),
      author_id: p.authorId,
      content: p.content,
      image_url: p.imageUrl || null,
      like_count: p.likeCount || 0,
      comment_count: p.commentCount || 0,
      created_at: p.createdAt,
      author_name: userDoc.name,
      author_username: userDoc.username,
      author_avatar: userDoc.avatarUrl || null,
      is_liked_by_me: likedSet.has(p._id.toString())
    }));

    return {
      profileData: {
        id: userId,
        name: userDoc.name,
        username: userDoc.username,
        email: isOwnProfile ? userDoc.email : undefined,
        bio: userDoc.bio || '',
        avatar_url: userDoc.avatarUrl || null,
        created_at: userDoc.createdAt,
        stats: {
          posts: postCount,
          comments: commentCount,
          likes_received: likesReceived
        },
        is_own_profile: isOwnProfile,
        posts: formattedPosts
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  const userSql = `
    SELECT id, name, username, email, bio, avatar_url, is_admin, created_at
    FROM users
    WHERE LOWER(username) = $1
    LIMIT 1;
  `;
  const userRes = await query(userSql, [cleanUsername]);

  if (userRes.rows.length === 0) {
    const t1 = performance.now();
    return { notFound: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'PostgreSQL' };
  }

  const targetUser = userRes.rows[0];
  const isOwnProfile = currentUserId === targetUser.id;

  const statsSql = `
    SELECT
      (SELECT COUNT(*)::int FROM posts WHERE author_id = $1) AS post_count,
      (SELECT COUNT(*)::int FROM comments WHERE author_id = $1) AS comment_count,
      (SELECT COALESCE(SUM(like_count), 0)::int FROM posts WHERE author_id = $1) AS likes_received;
  `;
  const statsRes = await query(statsSql, [targetUser.id]);
  const stats = statsRes.rows[0] || { post_count: 0, comment_count: 0, likes_received: 0 };

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
        WHERE pl.post_id = p.id AND ($2::uuid IS NOT NULL AND pl.user_id = $2::uuid)
      ) AS is_liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.author_id = $1
    ORDER BY p.created_at DESC;
  `;
  const postsRes = await query(postsSql, [targetUser.id, currentUserId || null]);
  const t1 = performance.now();

  return {
    profileData: {
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
        likes_received: stats.likes_received
      },
      is_own_profile: isOwnProfile,
      posts: postsRes.rows
    },
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 3. UPDATE USER PROFILE (EXCLUSIVELY ON ACTIVE ENGINE)
async function updateProfile(userId, { name, bio, avatarUrl }) {
  const activeEngine = getActiveEngine();
  const cleanName = (name || '').trim();
  const cleanBio = bio !== undefined ? bio.trim() : '';
  const cleanAvatar = avatarUrl !== undefined ? (avatarUrl.trim() || null) : undefined;
  const now = new Date();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const updateFields = {
      name: cleanName,
      bio: cleanBio,
      updatedAt: now
    };
    if (cleanAvatar !== undefined) {
      updateFields.avatarUrl = cleanAvatar;
    }

    const res = await mongoDb.collection('users').findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    const doc = res?.value || await mongoDb.collection('users').findOne({ _id: userId });
    const t1 = performance.now();

    if (!doc) return { notFound: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'MongoDB' };

    return {
      user: {
        id: doc._id.toString(),
        name: doc.name,
        username: doc.username,
        email: doc.email,
        bio: doc.bio || '',
        avatarUrl: doc.avatarUrl || null,
        isAdmin: doc.isAdmin || false,
        createdAt: doc.createdAt
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Implementation
  const pgSql = `
    UPDATE users 
    SET 
      name = $1,
      bio = $2,
      avatar_url = COALESCE($3, avatar_url),
      updated_at = $4
    WHERE id = $5::uuid
    RETURNING id, name, username, email, bio, avatar_url, is_admin, created_at;
  `;
  const pgRes = await query(pgSql, [cleanName, cleanBio, cleanAvatar, now, userId]);
  const t1 = performance.now();

  if (pgRes.rows.length === 0) {
    return { notFound: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'PostgreSQL' };
  }

  const row = pgRes.rows[0];
  return {
    user: {
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      bio: row.bio || '',
      avatarUrl: row.avatar_url || null,
      isAdmin: row.is_admin || false,
      createdAt: row.created_at
    },
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

module.exports = {
  getUserById,
  getProfile,
  updateProfile
};
