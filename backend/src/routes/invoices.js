const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  list,
  create,
  getOne,
  update,
  send,
  pay,
  cancel,
  remove
} = require('../controllers/invoicesController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('type').optional().isIn(['INVOICE', 'CREDIT_NOTE', 'QUOTE']).withMessage('Invalid invoice type'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isNumeric().withMessage('Item quantity must be a number'),
    body('items.*.price').isNumeric().withMessage('Item price must be a number')
  ],
  validate,
  create
);

router.get('/:id', getOne);

router.put(
  '/:id',
  [
    body('type').optional().isIn(['INVOICE', 'CREDIT_NOTE', 'QUOTE']).withMessage('Invalid invoice type'),
    body('items').optional().isArray({ min: 1 }).withMessage('At least one item is required')
  ],
  validate,
  update
);

router.post('/:id/send', send);
router.post('/:id/pay', pay);
router.post('/:id/cancel', cancel);
router.delete('/:id', remove);

module.exports = router;
