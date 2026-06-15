const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { list, create, getOne, update, remove } = require('../controllers/productsController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
    body('cost').optional().isNumeric().withMessage('Cost must be a number'),
    body('stock').optional().isNumeric().withMessage('Stock must be a number'),
    body('taxRate').optional().isNumeric().withMessage('Tax rate must be a number')
  ],
  validate,
  create
);

router.get('/:id', getOne);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
    body('cost').optional().isNumeric().withMessage('Cost must be a number'),
    body('stock').optional().isNumeric().withMessage('Stock must be a number'),
    body('taxRate').optional().isNumeric().withMessage('Tax rate must be a number')
  ],
  validate,
  update
);

router.delete('/:id', remove);

module.exports = router;
