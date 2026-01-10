const { createValidationError } = require('../utils/errors');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegistration = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return next(createValidationError('Valid email is required'));
  }

  if (!password || !validatePassword(password)) {
    return next(createValidationError('Password must be at least 6 characters'));
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return next(createValidationError('Valid email is required'));
  }

  if (!password) {
    return next(createValidationError('Password is required'));
  }

  next();
};

const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !validateEmail(email)) {
    return next(createValidationError('Valid email is required'));
  }

  if (!otp || otp.length !== 6) {
    return next(createValidationError('Valid 6-digit OTP is required'));
  }

  next();
};

const validateGoogleToken = (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(createValidationError('Google ID token is required'));
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateGoogleToken,
};
