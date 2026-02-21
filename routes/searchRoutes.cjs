const express = require('express');
const {
	searchDocumentsHandler,
	searchDocumentsQueryHandler
} = require('../controllers/documentController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const {
	searchDocumentSchema,
	searchDocumentsQuerySchema
} = require('../validators/documentValidators.cjs');

const router = express.Router();

router.get('/', validateRequest(searchDocumentsQuerySchema, 'query'), searchDocumentsQueryHandler);
router.post('/', validateRequest(searchDocumentSchema), searchDocumentsHandler);

module.exports = router;