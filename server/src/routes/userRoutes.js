const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');

// Profile routes
router.put('/profile', requireAuth, updateProfile);
router.get('/:username', requireAuth, getProfile);

module.exports = router;
