const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getFeed,
  createPost,
  toggleLike,
  getComments,
  addComment,
  deletePost,
} = require('../controllers/postController');

// All post endpoints require active student login session
router.get('/', requireAuth, getFeed);
router.post('/', requireAuth, createPost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, toggleLike);
router.get('/:id/comments', requireAuth, getComments);
router.post('/:id/comments', requireAuth, addComment);

module.exports = router;
