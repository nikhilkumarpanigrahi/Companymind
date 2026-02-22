const express = require('express');
const {
  createDocumentHandler,
  searchDocumentsHandler,
  getDocumentsHandler,
  getStatsHandler
} = require('../controllers/documentController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const {
  createDocumentSchema,
  searchDocumentSchema,
  listDocumentsQuerySchema
} = require('../validators/documentValidators.cjs');

const router = express.Router();

router.post('/', validateRequest(createDocumentSchema), createDocumentHandler);
router.get('/', validateRequest(listDocumentsQuerySchema, 'query'), getDocumentsHandler);
router.get('/stats', getStatsHandler);

module.exports = router;
