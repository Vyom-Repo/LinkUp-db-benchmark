const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');
const { getActiveEngine } = require('../config/engineState');

// 1. GET FEED
async function getFeed({ currentUserId, limit = 20, page = 1, offset = 0, sort = '', q = '', seed = '' }) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const pipeline = [];

    // Search filter
    if (q && q.trim()) {
      pipeline.push({
        $match: {
          content: { $regex: q.trim(), $options: 'i' }
        }
      });
    }

    // Sort order
    if (sort === 'trending') {
      pipeline.push(
        { $addFields: { engagement: { $add: ['$likeCount', '$commentCount'] } } },
        { $sort: { engagement: -1, createdAt: -1 } }
      );
    } else if (sort === 'liked') {
      pipeline.push({ $sort: { likeCount: -1, createdAt: -1 } });
    } else if (sort === 'discussed') {
      pipeline.push({ $sort: { commentCount: -1, createdAt: -1 } });
    } else if (sort === 'latest') {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else if (!q) {
      pipeline.push({ $sample: { size: limit } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Pagination
    if (sort || q) {
      pipeline.push({ $skip: offset }, { $limit: limit });
    }

    // Author join
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
    );

    const docs = await mongoDb.collection('posts').aggregate(pipeline).toArray();

    // Map like status for current user if authenticated
    let likedPostIds = new Set();
    if (currentUserId && docs.length > 0) {
      const postIds = docs.map(d => d._id.toString());
      const likes = await mongoDb.collection('post_likes').find({
        postId: { $in: postIds },
        userId: currentUserId
      }).toArray();
      likedPostIds = new Set(likes.map(l => l.postId.toString()));
    }

    const t1 = performance.now();
    const dbExecutionMs = parseFloat((t1 - t0).toFixed(2));

    const posts = docs.map(d => ({
      id: d._id.toString(),
      author_id: d.authorId,
      content: d.content,
      image_url: d.imageUrl || null,
      like_count: d.likeCount || 0,
      comment_count: d.commentCount || 0,
      created_at: d.createdAt,
      author_name: d.author?.name || 'Community Member',
      author_username: d.author?.username || 'user',
      author_avatar: d.author?.avatarUrl || null,
      is_liked_by_me: likedPostIds.has(d._id.toString())
    }));

    return { posts, dbExecutionMs, engine: 'MongoDB' };
  }

  // PostgreSQL Implementation
  let whereClause = '';
  let orderClause = '';
  const params = [currentUserId || null];
  let pIdx = 2;

  if (q && q.trim()) {
    whereClause = `WHERE p.content ILIKE $${pIdx}`;
    params.push(`%${q.trim()}%`);
    pIdx++;
  }

  if (sort === 'trending') {
    orderClause = 'ORDER BY (p.like_count + p.comment_count) DESC, p.created_at DESC';
  } else if (sort === 'liked') {
    orderClause = 'ORDER BY p.like_count DESC, p.created_at DESC';
  } else if (sort === 'discussed') {
    orderClause = 'ORDER BY p.comment_count DESC, p.created_at DESC';
  } else if (sort === 'latest') {
    orderClause = 'ORDER BY p.created_at DESC';
  } else if (!q) {
    orderClause = `ORDER BY hashtext(p.id::text || $${pIdx}) DESC`;
    params.push(seed || Date.now().toString());
    pIdx++;
  } else {
    orderClause = 'ORDER BY p.created_at DESC';
  }

  params.push(limit);
  const limitIdx = pIdx++;
  params.push(offset);
  const offsetIdx = pIdx++;

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
        WHERE pl.post_id = p.id AND ($1::uuid IS NOT NULL AND pl.user_id = $1::uuid)
      ) AS is_liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ${whereClause}
    ${orderClause}
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await query(sql, params);
  const t1 = performance.now();
  const dbExecutionMs = parseFloat((t1 - t0).toFixed(2));

  return { posts: result.rows, dbExecutionMs, engine: 'PostgreSQL' };
}

// 2. GET POST BY ID
async function getPostById(postId, currentUserId = null) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const docs = await mongoDb.collection('posts').aggregate([
      { $match: { _id: postId } },
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

    if (docs.length === 0) return { post: null, dbExecutionMs: 0, engine: 'MongoDB' };

    const d = docs[0];
    let isLikedByMe = false;
    if (currentUserId) {
      const like = await mongoDb.collection('post_likes').findOne({ postId, userId: currentUserId });
      isLikedByMe = !!like;
    }

    const t1 = performance.now();
    return {
      post: {
        id: d._id.toString(),
        author_id: d.authorId,
        content: d.content,
        image_url: d.imageUrl || null,
        like_count: d.likeCount || 0,
        comment_count: d.commentCount || 0,
        created_at: d.createdAt,
        author_name: d.author?.name || 'Community Member',
        author_username: d.author?.username || 'user',
        author_avatar: d.author?.avatarUrl || null,
        is_liked_by_me: isLikedByMe
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

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
        WHERE pl.post_id = p.id AND ($2::uuid IS NOT NULL AND pl.user_id = $2::uuid)
      ) AS is_liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.id = $1::uuid
    LIMIT 1;
  `;
  const result = await query(sql, [postId, currentUserId || null]);
  const t1 = performance.now();

  return {
    post: result.rows[0] || null,
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 3. SEARCH POSTS (DEDICATED FULL-TEXT / REGEX SEARCH)
async function searchPosts(queryStr, { limit = 20, offset = 0, currentUserId = null }) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const cleanQ = (queryStr || '').trim();

    // Use text index if indexed or regex
    const filter = cleanQ ? { $text: { $search: cleanQ } } : {};
    let docs;
    try {
      docs = await mongoDb.collection('posts').aggregate([
        { $match: filter },
        { $sort: { score: { $meta: 'textScore' } } },
        { $skip: offset },
        { $limit: limit },
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
    } catch (e) {
      // Fallback to regex if text index not yet built
      docs = await mongoDb.collection('posts').aggregate([
        { $match: { content: { $regex: cleanQ, $options: 'i' } } },
        { $sort: { createdAt: -1 } },
        { $skip: offset },
        { $limit: limit },
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
    }

    const t1 = performance.now();
    return {
      posts: docs.map(d => ({
        id: d._id.toString(),
        author_id: d.authorId,
        content: d.content,
        like_count: d.likeCount || 0,
        comment_count: d.commentCount || 0,
        created_at: d.createdAt,
        author_name: d.author?.name || 'Community Member',
        author_username: d.author?.username || 'user'
      })),
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL GIN Full-Text Search
  const cleanQ = (queryStr || '').trim();
  const sql = `
    SELECT 
      p.id,
      p.author_id,
      p.content,
      p.like_count,
      p.comment_count,
      p.created_at,
      u.name AS author_name,
      u.username AS author_username,
      ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', $1)) AS rank
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', $1)
       OR p.content ILIKE '%' || $1 || '%'
    ORDER BY rank DESC, p.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await query(sql, [cleanQ, limit, offset]);
  const t1 = performance.now();

  return {
    posts: result.rows,
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 4. GET POPULAR DISCUSSIONS
async function getPopularDiscussions(limit = 4) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const posts = await mongoDb.collection('posts').aggregate([
      {
        $addFields: {
          score: { $add: [{ $multiply: ['$likeCount', 2] }, { $multiply: ['$commentCount', 3] }] }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: limit },
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
    return {
      discussions: posts.map(p => ({
        id: p._id.toString(),
        content: p.content,
        like_count: p.likeCount || 0,
        comment_count: p.commentCount || 0,
        created_at: p.createdAt,
        author_username: p.author?.username || 'user',
        author_name: p.author?.name || 'Community Member'
      })),
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  const sql = `
    SELECT 
      p.id,
      p.content,
      p.like_count,
      p.comment_count,
      p.created_at,
      u.name AS author_name,
      u.username AS author_username
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY (p.like_count * 2 + p.comment_count * 3) DESC, p.created_at DESC
    LIMIT $1;
  `;
  const result = await query(sql, [limit]);
  const t1 = performance.now();

  return {
    discussions: result.rows,
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 5. CREATE POST (EXCLUSIVELY TO ACTIVE ENGINE)
async function createPost({ id, authorId, content, imageUrl = null, createdAt = new Date() }) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    await mongoDb.collection('posts').insertOne({
      _id: id,
      id,
      authorId,
      content,
      imageUrl,
      likeCount: 0,
      commentCount: 0,
      createdAt,
      updatedAt: createdAt
    });

    const authorDoc = await mongoDb.collection('users').findOne({ _id: authorId });
    const t1 = performance.now();

    return {
      post: {
        id,
        author_id: authorId,
        content,
        image_url: imageUrl,
        like_count: 0,
        comment_count: 0,
        created_at: createdAt.toISOString(),
        author_name: authorDoc?.name || 'User',
        author_username: authorDoc?.username || 'user',
        author_avatar: authorDoc?.avatarUrl || null,
        is_liked_by_me: false
      },
      dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
      engine: 'MongoDB'
    };
  }

  // PostgreSQL Insert
  await query(
    `INSERT INTO posts (id, author_id, content, image_url, like_count, comment_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 0, 0, $5, $5);`,
    [id, authorId, content, imageUrl, createdAt]
  );

  const authorRes = await query('SELECT name, username, avatar_url FROM users WHERE id = $1', [authorId]);
  const author = authorRes.rows[0] || {};
  const t1 = performance.now();

  return {
    post: {
      id,
      author_id: authorId,
      content,
      image_url: imageUrl,
      like_count: 0,
      comment_count: 0,
      created_at: createdAt.toISOString(),
      author_name: author.name || 'User',
      author_username: author.username || 'user',
      author_avatar: author.avatar_url || null,
      is_liked_by_me: false
    },
    dbExecutionMs: parseFloat((t1 - t0).toFixed(2)),
    engine: 'PostgreSQL'
  };
}

// 6. DELETE POST (EXCLUSIVELY FROM ACTIVE ENGINE)
async function deletePost(postId, userId, isAdmin = false) {
  const activeEngine = getActiveEngine();
  const t0 = performance.now();

  if (activeEngine === 'MONGODB') {
    const mongoDb = getMongoDb();
    const post = await mongoDb.collection('posts').findOne({ _id: postId });
    if (!post) return { notFound: true };
    if (post.authorId !== userId && !isAdmin) return { forbidden: true };

    await mongoDb.collection('posts').deleteOne({ _id: postId });
    await mongoDb.collection('post_likes').deleteMany({ postId });
    await mongoDb.collection('comments').deleteMany({ postId });
    const t1 = performance.now();

    return { success: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'MongoDB' };
  }

  const checkRes = await query('SELECT author_id FROM posts WHERE id = $1', [postId]);
  if (checkRes.rows.length === 0) return { notFound: true };
  if (checkRes.rows[0].author_id !== userId && !isAdmin) return { forbidden: true };

  await query('DELETE FROM posts WHERE id = $1', [postId]);
  const t1 = performance.now();

  return { success: true, dbExecutionMs: parseFloat((t1 - t0).toFixed(2)), engine: 'PostgreSQL' };
}

module.exports = {
  getFeed,
  getPostById,
  searchPosts,
  getPopularDiscussions,
  createPost,
  deletePost
};
