const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { list, create, getOne, update, remove } = require('../controllers/contactsController');

router.use(auth);

router.get('/', list);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').optional().isIn(['CLIENT', 'SUPPLIER', 'BOTH']).withMessage('Type must be CLIENT, SUPPLIER, or BOTH'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required')
  ],
  validate,
  create
);

router.get('/:id', getOne);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('type').optional().isIn(['CLIENT', 'SUPPLIER', 'BOTH']).withMessage('Type must be CLIENT, SUPPLIER, or BOTH'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required')
  ],
  validate,
  update
);

router.delete('/:id', remove);

module.exports = router;
