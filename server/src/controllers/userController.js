const userRepo = require('../repositories/userRepository');

// 1. GET USER PROFILE WITH REAL CALCULATED STATS AND POSTS
async function getProfile(req, res) {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const result = await userRepo.getProfile(username, currentUserId);
    res.locals.dbExecutionMs = result.dbExecutionMs;

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        error: { message: `User @${username} not found.` }
      });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.json({
      success: true,
      data: {
        ...result.profileData,
        engine: result.engine,
        dbExecutionMs: result.dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[getProfile Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve profile.' }
    });
  }
}

// 2. UPDATE PROFILE (ROUTED EXCLUSIVELY TO ACTIVE ENGINE)
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, bio, avatarUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name cannot be empty.' }
      });
    }

    const result = await userRepo.updateProfile(userId, { name, bio, avatarUrl });
    res.locals.dbExecutionMs = result.dbExecutionMs;

    if (result.notFound) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: result.user,
        engine: result.engine,
        dbExecutionMs: result.dbExecutionMs
      }
    });
  } catch (err) {
    console.error('[updateProfile Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile.' }
    });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
