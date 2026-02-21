const { z } = require('zod');

const createDocumentSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .trim()
    .min(1, 'title is required')
    .max(300, 'title cannot exceed 300 characters'),
  content: z
    .string({ required_error: 'content is required' })
    .trim()
    .min(1, 'content is required')
    .max(10000, 'content cannot exceed 10000 characters')
});

const searchDocumentSchema = z.object({
  query: z
    .string({ required_error: 'query is required' })
    .trim()
    .min(1, 'query is required')
    .max(1000, 'query cannot exceed 1000 characters'),
  limit: z
    .number()
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(50, 'limit cannot exceed 50')
    .optional()
    .default(10)
});

const searchDocumentsQuerySchema = z.object({
  q: z
    .string({ required_error: 'q is required' })
    .trim()
    .min(1, 'q is required')
    .max(1000, 'q cannot exceed 1000 characters'),
  page: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .refine(
      (value) => Number.isInteger(value) && value >= 1,
      'page must be an integer greater than or equal to 1'
    ),
  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 10))
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 50,
      'pageSize must be an integer between 1 and 50'
    )
});

const listDocumentsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 100))
    .refine(
      (value) => Number.isFinite(value) && value >= 1 && value <= 200,
      'limit must be a number between 1 and 200'
    )
});

module.exports = {
  createDocumentSchema,
  searchDocumentSchema,
  searchDocumentsQuerySchema,
  listDocumentsQuerySchema
};
