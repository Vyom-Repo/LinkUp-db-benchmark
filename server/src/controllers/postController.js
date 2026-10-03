const crypto = require('crypto');
const postRepo = require('../repositories/postRepository');
const commentRepo = require('../repositories/commentRepository');
const likeRepo = require('../repositories/likeRepository');

// 1. GET FEED & EXPLORE POSTS
async function getFeed(req, res) {
  try {
    const currentUserId = req.user?.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || '';
    const q = req.query.q || req.query.search || '';
    const seed = req.query.seed || req.query._t || Date.now().toString();

    const { posts, dbExecutionMs, engine } = await postRepo.getFeed({
      currentUserId,
      limit,
      page,
      offset,
      sort,
      q,
      seed
    });

    res.locals.dbExecutionMs = dbExecutionMs;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    return res.json({
      success: true,
      data: {
        posts,
        page,
        limit,
        hasMore: posts.length === limit,
        engine,
        dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[getFeed Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to load posts.' }
    });
  }
}

// 2. GET POST BY ID
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const { post, dbExecutionMs, engine } = await postRepo.getPostById(id, currentUserId);
    res.locals.dbExecutionMs = dbExecutionMs;

    if (!post) {
      return res.status(404).json({ success: false, error: { message: 'Post not found.' } });
    }

    return res.json({
      success: true,
      data: {
        post,
        engine,
        dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[getPostById Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch post.' } });
  }
}

// 3. SEARCH POSTS
async function searchPosts(req, res) {
  try {
    const queryStr = req.query.q || req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const currentUserId = req.user?.id;

    const { posts, dbExecutionMs, engine } = await postRepo.searchPosts(queryStr, {
      limit,
      offset,
      currentUserId
    });

    res.locals.dbExecutionMs = dbExecutionMs;
    return res.json({
      success: true,
      data: {
        posts,
        engine,
        dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[searchPosts Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to search posts.' } });
  }
}

// 4. GET POPULAR DISCUSSIONS
async function getPopularDiscussions(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 4;
    const { discussions, dbExecutionMs, engine } = await postRepo.getPopularDiscussions(limit);

    res.locals.dbExecutionMs = dbExecutionMs;
    return res.json({
      success: true,
      data: {
        discussions,
        engine,
        dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[getPopularDiscussions Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load popular discussions.' } });
  }
}

// 5. CREATE POST (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function createPost(req, res) {
  try {
    const authorId = req.user.id;
    const { content, imageUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Post content cannot be empty.' }
      });
    }

    const postId = crypto.randomUUID();
    const cleanContent = content.trim();
    const cleanImageUrl = imageUrl ? imageUrl.trim() : null;
    const now = new Date();

    const { post, dbExecutionMs, engine } = await postRepo.createPost({
      id: postId,
      authorId,
      content: cleanContent,
      imageUrl: cleanImageUrl,
      createdAt: now
    });

    res.locals.dbExecutionMs = dbExecutionMs;
    return res.status(201).json({
      success: true,
      data: { post, engine, dbExecutionMs }
    });
  } catch (err) {
    console.error('[createPost Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to publish post.' } });
  }
}

// 6. DELETE POST (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function deletePost(req, res) {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const result = await postRepo.deletePost(postId, userId, isAdmin);
    res.locals.dbExecutionMs = result.dbExecutionMs;

    if (result.notFound) {
      return res.status(404).json({ success: false, error: { message: 'Post not found.' } });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, error: { message: 'You can only delete your own posts.' } });
    }

    return res.json({
      success: true,
      message: 'Post deleted successfully.',
      data: { engine: result.engine, dbExecutionMs: result.dbExecutionMs }
    });
  } catch (err) {
    console.error('[deletePost Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to delete post.' } });
  }
}

// 7. TOGGLE LIKE (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function toggleLike(req, res) {
  try {
    const userId = req.user.id;
    const { id: postId } = req.params;

    const result = await likeRepo.toggleLike(postId, userId);
    res.locals.dbExecutionMs = result.dbExecutionMs;

    return res.json({
      success: true,
      data: {
        liked: result.liked,
        likeCount: result.likeCount,
        engine: result.engine,
        dbExecutionMs: result.dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[toggleLike Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update like status.' } });
  }
}

// 8. GET COMMENTS FOR A POST (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function getComments(req, res) {
  try {
    const { id: postId } = req.params;
    const { comments, dbExecutionMs, engine } = await commentRepo.getComments(postId);

    res.locals.dbExecutionMs = dbExecutionMs;
    return res.json({
      success: true,
      data: { comments, engine, dbExecutionMs }
    });
  } catch (err) {
    console.error('[getComments Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to load comments.' } });
  }
}

// 9. ADD COMMENT (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function addComment(req, res) {
  try {
    const authorId = req.user.id;
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment text cannot be empty.' }
      });
    }

    const commentId = crypto.randomUUID();
    const cleanContent = content.trim();
    const now = new Date();

    const { comment, dbExecutionMs, engine } = await commentRepo.addComment({
      id: commentId,
      postId,
      authorId,
      content: cleanContent,
      createdAt: now
    });

    res.locals.dbExecutionMs = dbExecutionMs;
    return res.status(201).json({
      success: true,
      data: { comment, engine, dbExecutionMs }
    });
  } catch (err) {
    console.error('[addComment Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to post comment.' } });
  }
}

module.exports = {
  getFeed,
  getPostById,
  searchPosts,
  getPopularDiscussions,
  createPost,
  deletePost,
  toggleLike,
  getComments,
  addComment
};
