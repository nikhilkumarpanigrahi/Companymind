const express = require('express');
const {
  createDocumentHandler,
  getDocumentsHandler,
  getStatsHandler
} = require('../controllers/documentController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const {
  createDocumentSchema,
  listDocumentsQuerySchema
} = require('../validators/documentValidators.cjs');

const router = express.Router();

router.post('/', validateRequest(createDocumentSchema), createDocumentHandler);
router.get('/', validateRequest(listDocumentsQuerySchema, 'query'), getDocumentsHandler);
router.get('/stats', getStatsHandler);

module.exports = router;
