const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getFeed,
  getPopularDiscussions,
  searchPosts,
  getPostById,
  createPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
} = require('../controllers/postController');

// All post endpoints require active student login session
router.get('/', requireAuth, getFeed);
router.get('/popular', requireAuth, getPopularDiscussions);
router.get('/search', requireAuth, searchPosts); // Declared BEFORE /:id to prevent route shadowing
router.get('/:id', requireAuth, getPostById);
router.post('/', requireAuth, createPost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, toggleLike);
router.get('/:id/comments', requireAuth, getComments);
router.post('/:id/comments', requireAuth, addComment);

module.exports = router;
