const express = require('express');
const {
	searchDocumentsHandler,
	searchDocumentsQueryHandler
} = require('../controllers/documentController');
const { validateRequest } = require('../middleware/validateRequest');
const {
	searchDocumentSchema,
	searchDocumentsQuerySchema
} = require('../validators/documentValidators');

const router = express.Router();

router.get('/', validateRequest(searchDocumentsQuerySchema, 'query'), searchDocumentsQueryHandler);
router.post('/', validateRequest(searchDocumentSchema), searchDocumentsHandler);

module.exports = router;