class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes as per requirements
const ErrorCodes = {
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
};

// Predefined error creators
const createTrialExpiredError = () => {
  return new AppError(
    'Your trial has expired. Please upgrade to continue creating expenses.',
    403,
    ErrorCodes.TRIAL_EXPIRED
  );
};

const createRateLimitError = () => {
  return new AppError(
    'You have exceeded your daily AI parsing limit. Please try again tomorrow or upgrade your plan.',
    429,
    ErrorCodes.RATE_LIMIT_EXCEEDED
  );
};

const createValidationError = (message) => {
  return new AppError(
    message || 'Validation failed',
    400,
    ErrorCodes.VALIDATION_ERROR
  );
};

const createAuthenticationError = (message) => {
  return new AppError(
    message || 'Authentication failed',
    401,
    ErrorCodes.AUTHENTICATION_ERROR
  );
};

const createAuthorizationError = (message) => {
  return new AppError(
    message || 'You do not have permission to perform this action',
    403,
    ErrorCodes.AUTHORIZATION_ERROR
  );
};

const createNotFoundError = (resource) => {
  return new AppError(
    `${resource || 'Resource'} not found`,
    404,
    ErrorCodes.NOT_FOUND
  );
};

const createAIProviderError = (message) => {
  return new AppError(
    message || 'AI provider service is currently unavailable',
    503,
    ErrorCodes.AI_PROVIDER_ERROR
  );
};

const createClarificationError = (question) => {
  return new AppError(
    question || 'Clarification required',
    400,
    ErrorCodes.CLARIFICATION_REQUIRED
  );
};

module.exports = {
  AppError,
  ErrorCodes,
  createTrialExpiredError,
  createRateLimitError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createAIProviderError,
  createClarificationError,
};
