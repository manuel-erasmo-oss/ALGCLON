const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { list, create, getOne } = require('../controllers/journalsController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    body('lines').isArray({ min: 2 }).withMessage('At least two journal lines are required'),
    body('lines.*.accountId').notEmpty().withMessage('Account ID is required for each line'),
    body('lines.*.debit').optional().isNumeric().withMessage('Debit must be a number'),
    body('lines.*.credit').optional().isNumeric().withMessage('Credit must be a number')
  ],
  validate,
  create
);

router.get('/:id', getOne);

module.exports = router;
