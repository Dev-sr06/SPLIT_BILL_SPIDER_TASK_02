const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Travel', 'Accommodation', 'Shopping', 'Others'] 
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  splitDetails: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    share: {
      type: Number, 
      default: 0
    }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
