const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { list, create, update, remove } = require('../controllers/accountsController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('code').trim().notEmpty().withMessage('Account code is required'),
    body('name').trim().notEmpty().withMessage('Account name is required'),
    body('type')
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'])
      .withMessage('Type must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE')
  ],
  validate,
  create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('type')
      .optional()
      .isIn(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'])
      .withMessage('Invalid account type')
  ],
  validate,
  update
);

router.delete('/:id', remove);

module.exports = router;
