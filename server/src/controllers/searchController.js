const { postRepo } = require('../repositories');
const systemState = require('../config/state');

const searchPosts = async (req, res, next) => {
  try {
    const queryText = (req.query.q || '').trim();
    if (!queryText) {
      return res.json({
        success: true,
        data: {
          posts: [],
          query: '',
        },
        meta: {
          engine: systemState.getActiveEngine(),
        },
      });
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const start = performance.now();
    const posts = await postRepo.search({ queryText, limit, offset });
    const durationMs = parseFloat((performance.now() - start).toFixed(2));

    res.json({
      success: true,
      data: {
        posts,
        query: queryText,
        pagination: {
          page,
          limit,
          count: posts.length,
        },
      },
      meta: {
        engine: systemState.getActiveEngine(),
        searchExecutionTimeMs: durationMs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchPosts,
};
