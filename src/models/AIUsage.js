const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },
  },
  count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for efficient daily usage queries
aiUsageSchema.index({ user_id: 1, date: 1 }, { unique: true });

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);

module.exports = AIUsage;
