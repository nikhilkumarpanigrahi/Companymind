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
    .max(10000, 'content cannot exceed 10000 characters'),
  category: z
    .string()
    .trim()
    .max(100)
    .optional(),
  tags: z
    .array(z.string().trim().max(50))
    .max(20)
    .optional()
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

const askQuestionSchema = z.object({
  question: z
    .string({ required_error: 'question is required' })
    .trim()
    .min(1, 'question is required')
    .max(2000, 'question cannot exceed 2000 characters'),
});

const askQuestionStreamSchema = z.object({
  question: z
    .string({ required_error: 'question is required' })
    .trim()
    .min(1, 'question is required')
    .max(2000, 'question cannot exceed 2000 characters'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(5000),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

const listDocumentsQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  pageSize: z.string().optional().transform((v) => (v ? Number(v) : 30))
    .refine((v) => Number.isFinite(v) && v >= 1 && v <= 100, 'pageSize must be 1-100'),
  search: z.string().optional().default(''),
  category: z.string().optional().default(''),
});

module.exports = {
  createDocumentSchema,
  searchDocumentSchema,
  searchDocumentsQuerySchema,
  askQuestionSchema,
  askQuestionStreamSchema,
  listDocumentsQuerySchema
};
