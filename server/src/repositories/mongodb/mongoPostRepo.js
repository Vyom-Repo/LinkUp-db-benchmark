const { getDb } = require('../../config/mongodb');

class MongoPostRepository {
  get collection() {
    return getDb().collection('posts');
  }

  get commentsCollection() {
    return getDb().collection('comments');
  }

  get likesCollection() {
    return getDb().collection('post_likes');
  }

  async create({ id, authorId, content }) {
    const now = new Date();
    const doc = {
      _id: id,
      authorId,
      content,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.insertOne(doc);
    return {
      id: doc._id,
      author_id: doc.authorId,
      content: doc.content,
      like_count: doc.likeCount,
      comment_count: doc.commentCount,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }

  async findById(id) {
    const pipeline = [
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          author_id: '$authorId',
          content: 1,
          like_count: '$likeCount',
          comment_count: '$commentCount',
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          author_name: '$author.name',
          author_username: '$author.username',
          author_avatar: '$author.avatarUrl',
        },
      },
    ];
    const results = await this.collection.aggregate(pipeline).toArray();
    return results[0] || null;
  }

  async getFeed({ limit = 20, offset = 0, sort = 'latest' } = {}) {
    let sortStage = { createdAt: -1 };
    if (sort === 'liked') {
      sortStage = { likeCount: -1, createdAt: -1 };
    } else if (sort === 'commented') {
      sortStage = { commentCount: -1, createdAt: -1 };
    }

    const pipeline = [
      { $sort: sortStage },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          author_id: '$authorId',
          content: 1,
          like_count: '$likeCount',
          comment_count: '$commentCount',
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          author_name: '$author.name',
          author_username: '$author.username',
          author_avatar: '$author.avatarUrl',
        },
      },
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }

  async getByAuthorId({ authorId, limit = 20, offset = 0 } = {}) {
    const pipeline = [
      { $match: { authorId } },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          author_id: '$authorId',
          content: 1,
          like_count: '$likeCount',
          comment_count: '$commentCount',
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          author_name: '$author.name',
          author_username: '$author.username',
          author_avatar: '$author.avatarUrl',
        },
      },
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }

  async update({ id, authorId, content }) {
    const filter = { _id: id, authorId };
    const updateDoc = {
      $set: {
        content,
        updatedAt: new Date(),
      },
    };
    const res = await this.collection.findOneAndUpdate(filter, updateDoc, { returnDocument: 'after' });
    if (!res) return null;
    return {
      id: res._id,
      author_id: res.authorId,
      content: res.content,
      like_count: res.likeCount,
      comment_count: res.commentCount,
      created_at: res.createdAt,
      updated_at: res.updatedAt,
    };
  }

  async delete({ id, authorId, isAdmin = false }) {
    const filter = isAdmin ? { _id: id } : { _id: id, authorId };
    const res = await this.collection.deleteOne(filter);
    if (res.deletedCount > 0) {
      // In MongoDB, cascade cleanup is handled at application layer
      await this.commentsCollection.deleteMany({ postId: id });
      await this.likesCollection.deleteMany({ postId: id });
      return true;
    }
    return false;
  }

  async search({ queryText, limit = 20, offset = 0 } = {}) {
    const pipeline = [
      { $match: { $text: { $search: queryText } } },
      { $sort: { score: { $meta: 'textScore' }, createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          author_id: '$authorId',
          content: 1,
          like_count: '$likeCount',
          comment_count: '$commentCount',
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          author_name: '$author.name',
          author_username: '$author.username',
          author_avatar: '$author.avatarUrl',
          score: { $meta: 'textScore' },
        },
      },
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }

  async count() {
    return await this.collection.countDocuments();
  }

  async getTopEngaged(limit = 5) {
    const pipeline = [
      {
        $addFields: {
          totalEngagement: { $add: ['$likeCount', '$commentCount'] },
        },
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          content: 1,
          like_count: '$likeCount',
          comment_count: '$commentCount',
          created_at: '$createdAt',
          author_username: '$author.username',
        },
      },
    ];
    return await this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = new MongoPostRepository();
