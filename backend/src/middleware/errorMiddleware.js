const { AppError } = require('../utils/AppError');

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    error instanceof AppError
      ? error.message
      : 'An unexpected server error occurred';

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = { errorMiddleware };
