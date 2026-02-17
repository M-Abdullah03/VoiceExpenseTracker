const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['bug', 'feature', 'general'], default: 'general' },
  rating: { type: Number, min: 1, max: 5, default: null },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
