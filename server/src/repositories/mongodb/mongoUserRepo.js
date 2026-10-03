const { getDb } = require('../../config/mongodb');

const formatUser = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id,
    name: doc.name,
    username: doc.username,
    email: doc.email,
    password_hash: doc.passwordHash,
    bio: doc.bio || '',
    avatar_url: doc.avatarUrl || '',
    is_admin: !!doc.isAdmin,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
};

class MongoUserRepository {
  get collection() {
    return getDb().collection('users');
  }

  async findById(id) {
    const doc = await this.collection.findOne({ _id: id });
    return formatUser(doc);
  }

  async findByEmail(email) {
    const doc = await this.collection.findOne({ email: email.toLowerCase().trim() });
    return formatUser(doc);
  }

  async findByUsername(username) {
    const doc = await this.collection.findOne({ username: username.toLowerCase().trim() });
    return formatUser(doc);
  }

  async create({ id, name, username, email, passwordHash, bio = '', avatarUrl = '', isAdmin = false }) {
    const now = new Date();
    const doc = {
      _id: id,
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      bio,
      avatarUrl,
      isAdmin,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.insertOne(doc);
    return formatUser(doc);
  }

  async count() {
    return await this.collection.countDocuments();
  }
}

module.exports = new MongoUserRepository();
