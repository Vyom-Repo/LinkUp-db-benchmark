const systemState = require('../config/state');

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      engine: systemState.getActiveEngine(),
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  errorHandler,
};
