const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { getSettings, updateSettings, updateCompany } = require('../controllers/settingsController');

router.use(auth);

router.get('/', getSettings);

router.put(
  '/',
  [
    body('invoicePrefix').optional().trim().notEmpty().withMessage('Invoice prefix cannot be empty'),
    body('quotePrefix').optional().trim().notEmpty().withMessage('Quote prefix cannot be empty'),
    body('defaultTaxRate').optional().isNumeric().withMessage('Tax rate must be a number'),
    body('invoiceNextNumber').optional().isInt({ min: 1 }).withMessage('Invoice number must be positive integer'),
    body('quoteNextNumber').optional().isInt({ min: 1 }).withMessage('Quote number must be positive integer')
  ],
  validate,
  updateSettings
);

router.put(
  '/company',
  [
    body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required')
  ],
  validate,
  updateCompany
);

module.exports = router;
