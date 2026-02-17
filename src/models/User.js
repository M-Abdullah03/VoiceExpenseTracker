const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CURRENCY_CODES } = require('../config/currencies');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: function() {
      return !this.oauth_provider;
    },
  },
  oauth_provider: {
    type: String,
    enum: ['google', null],
    default: null,
  },
  oauth_provider_id: {
    type: String,
    default: null,
  },
  profile_image_url: {
    type: String,
    default: null,
  },
  plan_status: {
    type: String,
    enum: ['trial', 'free', 'pro'],
    default: 'trial',
  },
  trial_started_at: {
    type: Date,
    default: Date.now,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: CURRENCY_CODES,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    monthly_budget: {
      type: Number,
      default: null,
    },
    category_limits: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  streak: {
    streak_count: { type: Number, default: 0 },
    best_streak: { type: Number, default: 0 },
    last_log_ts: { type: String, default: null },
    last_log_local_date: { type: String, default: null },
    timezone: { type: String, default: null },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ oauth_provider: 1, oauth_provider_id: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash') || !this.password_hash) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password_hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to check if trial is expired
userSchema.methods.isTrialExpired = function(trialDurationDays) {
  if (this.plan_status !== 'trial') {
    return false;
  }

  const trialEndDate = new Date(this.trial_started_at);
  trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);

  return new Date() > trialEndDate;
};

// Method to check if user can create/edit expenses
userSchema.methods.canModifyExpenses = function(trialDurationDays) {
  if (this.plan_status === 'pro') {
    return true;
  }

  if (this.plan_status === 'trial') {
    return !this.isTrialExpired(trialDurationDays);
  }

  return false; // free users cannot modify
};

const User = mongoose.model('User', userSchema);

module.exports = User;
