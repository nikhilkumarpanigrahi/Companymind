const express = require('express');
const { askQuestionHandler } = require('../controllers/ragController.cjs');
const { validateRequest } = require('../middleware/validateRequest.cjs');
const { askQuestionSchema } = require('../validators/documentValidators.cjs');

const router = express.Router();

router.post('/', validateRequest(askQuestionSchema), askQuestionHandler);

module.exports = router;
