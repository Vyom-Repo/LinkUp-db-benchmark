const express = require('express');
const {
  createPost,
  getFeed,
  getPostById,
  getPostsByAuthor,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require('../controllers/postController');
const {
  createComment,
  getCommentsByPostId,
} = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Feed & Post CRUD
router.get('/', optionalAuth, getFeed);
router.post('/', requireAuth, createPost);
router.get('/:id', optionalAuth, getPostById);
router.put('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);

// Author timeline
router.get('/author/:authorId', optionalAuth, getPostsByAuthor);

// Likes
router.post('/:id/like', requireAuth, likePost);
router.delete('/:id/like', requireAuth, unlikePost);

// Comments nested under post
router.get('/:postId/comments', getCommentsByPostId);
router.post('/:postId/comments', requireAuth, createComment);

module.exports = router;
