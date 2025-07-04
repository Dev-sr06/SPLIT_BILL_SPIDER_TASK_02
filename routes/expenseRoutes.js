const express = require('express');
const router = express.Router();
const {
  addExpense,
  getGroupExpenses,
  deleteExpense,
  getBillSplit
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addExpense);

router.route('/group/:groupId')
  .get(protect, getGroupExpenses);

router.route('/:id')
  .delete(protect, deleteExpense);

router.get('/group/:groupId/bill-split', protect, getBillSplit);

module.exports = router;