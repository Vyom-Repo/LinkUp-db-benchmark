const systemState = require('../config/state');

// PostgreSQL Repositories
const pgUserRepo = require('./postgres/pgUserRepo');
const pgPostRepo = require('./postgres/pgPostRepo');
const pgCommentRepo = require('./postgres/pgCommentRepo');
const pgLikeRepo = require('./postgres/pgLikeRepo');
const pgDiagnosticsRepo = require('./postgres/pgDiagnosticsRepo');

// MongoDB Repositories
const mongoUserRepo = require('./mongodb/mongoUserRepo');
const mongoPostRepo = require('./mongodb/mongoPostRepo');
const mongoCommentRepo = require('./mongodb/mongoCommentRepo');
const mongoLikeRepo = require('./mongodb/mongoLikeRepo');
const mongoDiagnosticsRepo = require('./mongodb/mongoDiagnosticsRepo');

/**
 * Dynamic Proxy Router: Dispatches method calls to the active engine repository
 */
const createRepositoryProxy = (pgRepo, mongoRepo) => {
  return new Proxy({}, {
    get(target, prop) {
      return (...args) => {
        const engine = systemState.getActiveEngine();
        const activeRepo = engine === 'mongodb' ? mongoRepo : pgRepo;
        if (typeof activeRepo[prop] !== 'function') {
          throw new TypeError(`Method "${prop}" is not implemented on ${engine} repository.`);
        }
        return activeRepo[prop](...args);
      };
    },
  });
};

// Unified dynamic repositories for normal application operations
const userRepo = createRepositoryProxy(pgUserRepo, mongoUserRepo);
const postRepo = createRepositoryProxy(pgPostRepo, mongoPostRepo);
const commentRepo = createRepositoryProxy(pgCommentRepo, mongoCommentRepo);
const likeRepo = createRepositoryProxy(pgLikeRepo, mongoLikeRepo);
const diagnosticsRepo = createRepositoryProxy(pgDiagnosticsRepo, mongoDiagnosticsRepo);

module.exports = {
  // Dynamic switched access
  userRepo,
  postRepo,
  commentRepo,
  likeRepo,
  diagnosticsRepo,

  // Direct engine access (Used by Benchmark runner & Deterministic Seeder)
  postgres: {
    users: pgUserRepo,
    posts: pgPostRepo,
    comments: pgCommentRepo,
    likes: pgLikeRepo,
    diagnostics: pgDiagnosticsRepo,
  },
  mongodb: {
    users: mongoUserRepo,
    posts: mongoPostRepo,
    comments: mongoCommentRepo,
    likes: mongoLikeRepo,
    diagnostics: mongoDiagnosticsRepo,
  },
};
