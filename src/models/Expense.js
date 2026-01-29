const mongoose = require('mongoose');

const CATEGORIES = [
  'Food & Drink',
  'Groceries',
  'Transport',
  'Rent',
  'Entertainment',
  'Other', 
];

const expenseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  merchant: {
    type: String,
    trim: true,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    default: null,
  },
  raw_transcription: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
expenseSchema.index({ user_id: 1, date: -1 });
expenseSchema.index({ user_id: 1, category: 1 });
expenseSchema.index({ user_id: 1, created_at: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { Expense, CATEGORIES };
