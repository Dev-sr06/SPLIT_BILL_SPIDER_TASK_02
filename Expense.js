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
    enum: ['Food', 'Travel', 'Accommodation', 'Shopping', 'Others'] // Example categories
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
  // This can be used for more complex splitting, for equal split, just divide amount by members.length
  // For now, we'll calculate on the fly for equal split, but this field is good for future
  splitDetails: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    share: {
      type: Number, // The amount this user owes
      default: 0
    }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);