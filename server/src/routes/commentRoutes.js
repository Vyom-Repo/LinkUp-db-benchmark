const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const commentRepo = require('../repositories/commentRepository');

// DELETE /api/comments/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const result = await commentRepo.deleteComment(id, userId, isAdmin);
    res.locals.dbExecutionMs = result.dbExecutionMs;

    if (result.notFound) {
      return res.status(404).json({ success: false, error: { message: 'Comment not found.' } });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, error: { message: 'You can only delete your own comments.' } });
    }

    return res.json({
      success: true,
      message: 'Comment deleted successfully.',
      data: { dbExecutionMs: result.dbExecutionMs, engine: result.engine }
    });
  } catch (err) {
    console.error('[deleteComment Route Error]:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to delete comment.' } });
  }
});

module.exports = router;
