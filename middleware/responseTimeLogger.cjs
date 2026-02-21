const responseTimeLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    console.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(2)}ms`
    );
  });

  next();
};

module.exports = { responseTimeLogger };
