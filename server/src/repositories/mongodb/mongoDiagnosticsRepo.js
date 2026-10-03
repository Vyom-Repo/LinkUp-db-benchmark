const { getDb } = require('../../config/mongodb');

class MongoDiagnosticsRepo {
  async explainQuery({ collectionName = 'posts', filter = {}, sort = { createdAt: -1 }, limit = 20 } = {}) {
    const db = getDb();
    const coll = db.collection(collectionName);

    const start = performance.now();
    const cursor = coll.find(filter).sort(sort).limit(limit);
    const explainResult = await cursor.explain('executionStats');
    const duration = performance.now() - start;

    const stats = explainResult.executionStats || {};
    const executionStages = stats.executionStages || {};

    return {
      engine: 'mongodb',
      totalDurationMs: parseFloat(duration.toFixed(3)),
      executionTimeMillis: stats.executionTimeMillis || 0,
      totalKeysExamined: stats.totalKeysExamined || 0,
      totalDocsExamined: stats.totalDocsExamined || 0,
      nReturned: stats.nReturned || 0,
      stage: executionStages.stage || 'UNKNOWN',
      isIndexScan: executionStages.stage === 'IXSCAN' || (executionStages.inputStage && executionStages.inputStage.stage === 'IXSCAN'),
      rawStats: stats,
    };
  }

  async getStorageStats() {
    const db = getDb();
    const collections = ['users', 'posts', 'comments', 'post_likes'];

    let totalSizeBytes = 0;
    let totalStorageBytes = 0;
    let totalIndexBytes = 0;

    const collDetails = [];

    for (const name of collections) {
      try {
        const stats = await db.command({ collStats: name });
        const size = stats.size || 0;
        const storage = stats.storageSize || 0;
        const indexes = stats.totalIndexSize || 0;

        totalSizeBytes += size;
        totalStorageBytes += storage;
        totalIndexBytes += indexes;

        collDetails.push({
          collection: name,
          count: stats.count || 0,
          dataSizeMB: parseFloat((size / (1024 * 1024)).toFixed(3)),
          storageSizeMB: parseFloat((storage / (1024 * 1024)).toFixed(3)),
          indexSizeMB: parseFloat((indexes / (1024 * 1024)).toFixed(3)),
          totalSizeMB: parseFloat(((storage + indexes) / (1024 * 1024)).toFixed(3)),
        });
      } catch (err) {
        collDetails.push({
          collection: name,
          error: err.message,
        });
      }
    }

    return {
      engine: 'mongodb',
      dataSizeMB: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(3)),
      storageSizeMB: parseFloat((totalStorageBytes / (1024 * 1024)).toFixed(3)),
      indexSizeMB: parseFloat((totalIndexBytes / (1024 * 1024)).toFixed(3)),
      totalSizeMB: parseFloat(((totalStorageBytes + totalIndexBytes) / (1024 * 1024)).toFixed(3)),
      collections: collDetails,
    };
  }

  async toggleIndex({ target = 'posts_author', state = 'disable' } = {}) {
    const db = getDb();
    const coll = db.collection('posts');

    if (target === 'posts_author') {
      if (state === 'disable') {
        try {
          await coll.dropIndex({ authorId: 1, createdAt: -1 });
          return { index: 'authorId_1_createdAt_-1', status: 'dropped' };
        } catch (e) {
          return { index: 'authorId_1_createdAt_-1', status: 'not_found' };
        }
      } else {
        await coll.createIndex({ authorId: 1, createdAt: -1 });
        return { index: 'authorId_1_createdAt_-1', status: 'created' };
      }
    }
    throw new Error(`Unsupported index target: ${target}`);
  }
}

module.exports = new MongoDiagnosticsRepo();
