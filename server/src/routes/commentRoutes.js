const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.delete('/:id', requireAuth, deleteComment);

module.exports = router;
