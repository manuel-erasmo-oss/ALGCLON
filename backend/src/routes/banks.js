const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  list,
  create,
  getTransactions,
  addTransaction,
  reconcileTransaction
} = require('../controllers/banksController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Account name is required'),
    body('balance').optional().isNumeric().withMessage('Balance must be a number')
  ],
  validate,
  create
);

router.get('/:id/transactions', getTransactions);

router.post(
  '/:id/transactions',
  [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').isIn(['DEBIT', 'CREDIT']).withMessage('Type must be DEBIT or CREDIT'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
  ],
  validate,
  addTransaction
);

router.put('/transactions/:txId/reconcile', reconcileTransaction);

module.exports = router;
