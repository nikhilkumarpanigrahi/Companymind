const express = require('express');
const { runBenchmarkHandler } = require('../controllers/benchmarkController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const { z } = require('zod');

const benchmarkSchema = z.object({
  query: z
    .string({ required_error: 'query is required' })
    .trim()
    .min(1, 'query is required')
    .max(1000),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10),
});

const router = express.Router();

router.post('/', validateRequest(benchmarkSchema), runBenchmarkHandler);

module.exports = router;
