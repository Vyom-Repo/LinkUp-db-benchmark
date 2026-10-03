const { getDb } = require('../../config/mongodb');

class MongoCommentRepository {
  get collection() {
    return getDb().collection('comments');
  }

  get postsCollection() {
    return getDb().collection('posts');
  }

  async create({ id, postId, authorId, content }) {
    const now = new Date();
    const doc = {
      _id: id,
      postId,
      authorId,
      content,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.insertOne(doc);

    // Sequential application workflow: Maintain commentCount counter
    await this.postsCollection.updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 } }
    );

    return {
      id: doc._id,
      post_id: doc.postId,
      author_id: doc.authorId,
      content: doc.content,
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
          post_id: '$postId',
          author_id: '$authorId',
          content: 1,
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

  async getByPostId({ postId, limit = 50, offset = 0 } = {}) {
    const pipeline = [
      { $match: { postId } },
      { $sort: { createdAt: 1 } },
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
          post_id: '$postId',
          author_id: '$authorId',
          content: 1,
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

  async delete({ id, authorId, isAdmin = false }) {
    const comment = await this.collection.findOne({ _id: id });
    if (!comment) return false;

    if (!isAdmin && comment.authorId !== authorId) {
      return false;
    }

    const res = await this.collection.deleteOne({ _id: id });
    if (res.deletedCount > 0) {
      // Decrement post counter
      await this.postsCollection.updateOne(
        { _id: comment.postId, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } }
      );
      return true;
    }
    return false;
  }

  async count() {
    return await this.collection.countDocuments();
  }
}

module.exports = new MongoCommentRepository();
