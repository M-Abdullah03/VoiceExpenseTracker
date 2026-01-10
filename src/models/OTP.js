const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying and automatic cleanup
otpSchema.index({ email: 1 });
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
