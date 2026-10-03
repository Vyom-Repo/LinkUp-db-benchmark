const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/postgres');
const { getMongoDb } = require('../config/mongodb');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin || user.isAdmin || false,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// 1. REGISTER USER (DUAL-WRITE to both PostgreSQL and MongoDB)
async function register(req, res) {
  try {
    const { name, username, email, password, bio, avatarUrl } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name, username, email, and password are required.' },
      });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long.' },
      });
    }

    // Check if username or email already exists in PostgreSQL
    const existingPg = await query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2 LIMIT 1;',
      [cleanUsername, cleanEmail]
    );

    if (existingPg.rows.length > 0) {
      const match = existingPg.rows[0];
      const field = match.email === cleanEmail ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        error: { message: `${field} is already registered. Please log in or use a different one.` },
      });
    }

    // Check MongoDB for redundancy
    const mongoDb = getMongoDb();
    const existingMongo = await mongoDb.collection('users').findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingMongo) {
      const field = existingMongo.email === cleanEmail ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        error: { message: `${field} is already registered.` },
      });
    }

    // Generate credentials & canonical UUID
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const cleanBio = bio ? bio.trim() : '';
    const cleanAvatar = avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;

    // A. WRITE TO POSTGRESQL
    await query(
      `INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, is_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [userId, name.trim(), cleanUsername, cleanEmail, passwordHash, cleanBio, cleanAvatar, false, now, now]
    );

    // B. WRITE TO MONGODB
    await mongoDb.collection('users').insertOne({
      _id: userId,
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      bio: cleanBio,
      avatarUrl: cleanAvatar,
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[Dual-Write Auth] User "${cleanUsername}" successfully registered in BOTH PostgreSQL and MongoDB! (ID: ${userId})`);

    const userPayload = {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      bio: cleanBio,
      avatarUrl: cleanAvatar,
      isAdmin: false,
    };

    const token = generateToken(userPayload);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully in both PostgreSQL and MongoDB.',
      data: {
        user: userPayload,
        token,
      },
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error during registration.' },
    });
  }
}

// 2. LOGIN USER (Validates credentials against database)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email/username and password are required.' },
      });
    }

    const identifier = email.trim().toLowerCase();

    // Query user from PostgreSQL first
    let user = null;
    let passwordHash = null;

    const pgResult = await query(
      'SELECT id, name, username, email, password_hash, bio, avatar_url, is_admin FROM users WHERE email = $1 OR username = $1 LIMIT 1;',
      [identifier]
    );

    if (pgResult.rows.length > 0) {
      const row = pgResult.rows[0];
      user = {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        isAdmin: row.is_admin,
      };
      passwordHash = row.password_hash;
    } else {
      // Fallback query to MongoDB
      const mongoDb = getMongoDb();
      const mongoUser = await mongoDb.collection('users').findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (mongoUser) {
        user = {
          id: mongoUser.id || mongoUser._id,
          name: mongoUser.name,
          username: mongoUser.username,
          email: mongoUser.email,
          bio: mongoUser.bio,
          avatarUrl: mongoUser.avatarUrl,
          isAdmin: mongoUser.isAdmin || false,
        };
        passwordHash = mongoUser.passwordHash;
      }
    }

    if (!user || !passwordHash) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials. User not found.' },
      });
    }

    const passwordMatches = await bcrypt.compare(password, passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials. Incorrect password.' },
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error during login.' },
    });
  }
}

// 3. GET CURRENT USER PROFILE (/api/auth/me)
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const pgRes = await query(
      'SELECT id, name, username, email, bio, avatar_url, is_admin, created_at FROM users WHERE id = $1;',
      [userId]
    );

    if (pgRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.' },
      });
    }

    const row = pgRes.rows[0];
    return res.json({
      success: true,
      data: {
        user: {
          id: row.id,
          name: row.name,
          username: row.username,
          email: row.email,
          bio: row.bio,
          avatarUrl: row.avatar_url,
          isAdmin: row.is_admin,
          createdAt: row.created_at,
        },
      },
    });
  } catch (err) {
    console.error('[Auth getMe Error]:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch current user profile.' },
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
};
