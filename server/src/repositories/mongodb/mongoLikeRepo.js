const { getDb } = require('../../config/mongodb');

class MongoLikeRepository {
  get collection() {
    return getDb().collection('post_likes');
  }

  get postsCollection() {
    return getDb().collection('posts');
  }

  async addLike({ postId, userId }) {
    const likeDoc = {
      _id: `${postId}_${userId}`, // Deterministic unique composite ID
      postId,
      userId,
      createdAt: new Date(),
    };

    try {
      await this.collection.insertOne(likeDoc);

      // Increment like count ONLY on successful insertion
      await this.postsCollection.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } }
      );

      return {
        liked: true,
        alreadyLiked: false,
      };
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key violation (already liked)
        return {
          liked: true,
          alreadyLiked: true,
        };
      }
      throw err;
    }
  }

  async removeLike({ postId, userId }) {
    const res = await this.collection.deleteOne({ postId, userId });
    if (res.deletedCount > 0) {
      // Decrement like count ONLY if a row was actually deleted
      await this.postsCollection.updateOne(
        { _id: postId, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } }
      );
      return {
        liked: false,
        wasLiked: true,
      };
    }
    return {
      liked: false,
      wasLiked: false,
    };
  }

  async hasLiked({ postId, userId }) {
    const count = await this.collection.countDocuments({ postId, userId }, { limit: 1 });
    return count > 0;
  }

  async getLikedPostIdsByUser({ userId, postIds = [] }) {
    if (postIds.length === 0) return [];
    const likes = await this.collection
      .find({ userId, postId: { $in: postIds } }, { projection: { postId: 1 } })
      .toArray();
    return likes.map((l) => l.postId);
  }

  async count() {
    return await this.collection.countDocuments();
  }
}

module.exports = new MongoLikeRepository();
