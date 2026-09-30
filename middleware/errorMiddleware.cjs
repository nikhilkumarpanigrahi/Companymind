const { AppError } = require('../utils/AppError.cjs');

const errorMiddleware = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload'
    });
  }

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
