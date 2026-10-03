const express = require('express');
const { searchPosts } = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, searchPosts);

module.exports = router;
