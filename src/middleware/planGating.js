const config = require('../config/config');
const { createTrialExpiredError, createAuthorizationError } = require('../utils/errors');

// Middleware to check if user can modify expenses (create/update/delete)
const canModifyExpenses = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw createAuthorizationError('User not authenticated');
    }

    // Check if user has active plan or trial
    const canModify = user.canModifyExpenses(config.TRIAL_DURATION_DAYS);

    if (!canModify) {
      if (user.plan_status === 'trial' && user.isTrialExpired(config.TRIAL_DURATION_DAYS)) {
        throw createTrialExpiredError();
      }

      throw createAuthorizationError(
        'Your plan does not allow creating or modifying expenses. Please upgrade to Pro.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check email verification (for email/password users)
const requireEmailVerification = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw createAuthorizationError('User not authenticated');
    }

    // OAuth users don't need email verification
    if (user.oauth_provider) {
      return next();
    }

    // Email/password users must verify email
    if (!user.email_verified) {
      throw createAuthorizationError('Please verify your email before continuing');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  canModifyExpenses,
  requireEmailVerification,
};
