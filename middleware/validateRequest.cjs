const { AppError } = require('../utils/AppError.cjs');

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return next(new AppError(message, 400));
    }

    req[source] = result.data;
    return next();
  };
};

module.exports = { validateRequest };
