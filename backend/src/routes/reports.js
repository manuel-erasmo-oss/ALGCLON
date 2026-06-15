const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  dashboard,
  incomeStatement,
  balanceSheet,
  cashFlow,
  accountsReceivable,
  accountsPayable,
  taxReport
} = require('../controllers/reportsController');

router.use(auth);

router.get('/dashboard', dashboard);
router.get('/income-statement', incomeStatement);
router.get('/balance-sheet', balanceSheet);
router.get('/cash-flow', cashFlow);
router.get('/accounts-receivable', accountsReceivable);
router.get('/accounts-payable', accountsPayable);
router.get('/tax-report', taxReport);

module.exports = router;
