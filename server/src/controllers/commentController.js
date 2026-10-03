const crypto = require('crypto');
const { commentRepo, postRepo } = require('../repositories');
const systemState = require('../config/state');

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment content cannot be empty.',
        },
      });
    }

    const post = await postRepo.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post does not exist.',
        },
      });
    }

    const commentId = crypto.randomUUID();
    const newComment = await commentRepo.create({
      id: commentId,
      postId,
      authorId: req.user.id,
      content: content.trim(),
    });

    res.status(201).json({
      success: true,
      data: {
        comment: {
          ...newComment,
          author_name: req.user.name,
          author_username: req.user.username,
          author_avatar: req.user.avatar_url,
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

const getCommentsByPostId = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const comments = await commentRepo.getByPostId({ postId, limit, offset });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          count: comments.length,
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

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.user.is_admin;

    const deleted = await commentRepo.delete({
      id,
      authorId: req.user.id,
      isAdmin,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found or you are not authorized to delete it.',
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

module.exports = {
  createComment,
  getCommentsByPostId,
  deleteComment,
};
