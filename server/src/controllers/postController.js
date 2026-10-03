const crypto = require('crypto');
const { postRepo, likeRepo } = require('../repositories');
const systemState = require('../config/state');

const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Post content cannot be empty.',
        },
      });
    }

    const postId = crypto.randomUUID();
    const newPost = await postRepo.create({
      id: postId,
      authorId: req.user.id,
      content: content.trim(),
      imageUrl: imageUrl || '',
    });

    res.status(201).json({
      success: true,
      data: {
        post: {
          ...newPost,
          author_name: req.user.name,
          author_username: req.user.username,
          author_avatar: req.user.avatar_url,
          is_liked_by_me: false,
        },
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'latest';

    const posts = await postRepo.getFeed({ limit, offset, sort });

    // Check likes for current authenticated user if logged in
    let likedPostIdSet = new Set();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const likedIds = await likeRepo.getLikedPostIdsByUser({
        userId: req.user.id,
        postIds,
      });
      likedPostIdSet = new Set(likedIds);
    }

    const enrichedPosts = posts.map((post) => ({
      ...post,
      is_liked_by_me: likedPostIdSet.has(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          count: enrichedPosts.length,
        },
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await postRepo.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found.',
        },
      });
    }

    let isLikedByMe = false;
    if (req.user) {
      isLikedByMe = await likeRepo.hasLiked({ postId: id, userId: req.user.id });
    }

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          is_liked_by_me: isLikedByMe,
        },
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPostsByAuthor = async (req, res, next) => {
  try {
    const { authorId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const posts = await postRepo.getByAuthorId({ authorId, limit, offset });

    let likedPostIdSet = new Set();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const likedIds = await likeRepo.getLikedPostIdsByUser({
        userId: req.user.id,
        postIds,
      });
      likedPostIdSet = new Set(likedIds);
    }

    const enrichedPosts = posts.map((post) => ({
      ...post,
      is_liked_by_me: likedPostIdSet.has(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: { page, limit, count: enrichedPosts.length },
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content cannot be empty.',
        },
      });
    }

    const updated = await postRepo.update({
      id,
      authorId: req.user.id,
      content: content.trim(),
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found or you are not authorized to edit this post.',
        },
      });
    }

    res.json({
      success: true,
      data: { post: updated },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.user.is_admin;

    const deleted = await postRepo.delete({
      id,
      authorId: req.user.id,
      isAdmin,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found or you do not have permission to delete it.',
        },
      });
    }

    res.json({
      success: true,
      data: { deleted: true, id },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await postRepo.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found.' },
      });
    }

    const result = await likeRepo.addLike({ postId: id, userId: req.user.id });
    const freshPost = await postRepo.findById(id);

    res.json({
      success: true,
      data: {
        liked: true,
        alreadyLiked: result.alreadyLiked,
        likeCount: freshPost ? freshPost.like_count : post.like_count,
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await postRepo.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found.' },
      });
    }

    const result = await likeRepo.removeLike({ postId: id, userId: req.user.id });
    const freshPost = await postRepo.findById(id);

    res.json({
      success: true,
      data: {
        liked: false,
        wasLiked: result.wasLiked,
        likeCount: freshPost ? freshPost.like_count : post.like_count,
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  getPostsByAuthor,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
