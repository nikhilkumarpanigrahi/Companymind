const express = require('express');
const {
  createDocumentHandler,
  searchDocumentsHandler,
  getDocumentsHandler
} = require('../controllers/documentController');
const { validateRequest } = require('../middleware/validateRequest');
const {
  createDocumentSchema,
  searchDocumentSchema,
  listDocumentsQuerySchema
} = require('../validators/documentValidators');

const router = express.Router();

router.post('/', validateRequest(createDocumentSchema), createDocumentHandler);
router.get('/', validateRequest(listDocumentsQuerySchema, 'query'), getDocumentsHandler);

module.exports = router;
