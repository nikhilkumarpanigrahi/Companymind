const { AppError } = require('../utils/AppError');

const notFoundMiddleware = (req, res, next) => {
  return next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { notFoundMiddleware };
