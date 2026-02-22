const express = require('express');
const { askQuestionHandler, askQuestionStreamHandler, getAnalyticsHandler } = require('../controllers/ragController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const { askQuestionSchema, askQuestionStreamSchema } = require('../validators/documentValidators.cjs');

const router = express.Router();

router.post('/', validateRequest(askQuestionSchema), askQuestionHandler);
router.post('/stream', validateRequest(askQuestionStreamSchema), askQuestionStreamHandler);
router.get('/analytics', getAnalyticsHandler);

module.exports = router;
