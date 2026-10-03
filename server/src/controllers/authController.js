const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { userRepo } = require('../repositories');
const systemState = require('../config/state');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, username, email, password, bio } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, username, email, and password are required.',
        },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long.',
        },
      });
    }

    // Check unique email and username
    const existingEmail = await userRepo.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
    }

    const existingUsername = await userRepo.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'This username is already taken.',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;

    const newUser = await userRepo.create({
      id: userId,
      name,
      username,
      email,
      passwordHash,
      bio: bio || '',
      avatarUrl,
      isAdmin: false,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          bio: newUser.bio,
          avatarUrl: newUser.avatar_url,
          isAdmin: newUser.is_admin,
          createdAt: newUser.created_at,
        },
        token,
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.',
        },
      });
    }

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
        },
        token,
      },
      meta: {
        engine: systemState.getActiveEngine(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        bio: req.user.bio,
        avatarUrl: req.user.avatar_url,
        isAdmin: req.user.is_admin,
        createdAt: req.user.created_at,
      },
    },
    meta: {
      engine: systemState.getActiveEngine(),
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
};
