const User = require('../models/User');
const jwtService = require('../services/jwtService');
const otpService = require('../services/otpService');
const oauthService = require('../services/oauthService');
const emailService = require('../services/emailService');
const { CURRENCIES } = require('../config/currencies');
const { createAuthenticationError, createValidationError, ErrorCodes } = require('../utils/errors');

class AuthController {
  // Register with email and password
  async register(req, res, next) {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const error = new Error('An account with this email already exists');
        error.statusCode = 409;
        error.errorCode = ErrorCodes.DUPLICATE_EMAIL;
        throw error;
      }

      // Create user
      const user = await User.create({
        email,
        password_hash: password, // Will be hashed by pre-save hook
        plan_status: 'trial',
        email_verified: false,
      });

      // Generate and send OTP
      const otp = await otpService.createOTP(email);
      await otpService.sendOTP(email, otp);

      res.status(201).json({
        success: true,
        data: {
          message: 'Registration successful. Please verify your email with the OTP sent to you.',
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Verify OTP
      const isValid = await otpService.verifyOTP(email, otp);

      if (!isValid) {
        const error = new Error('Invalid or expired OTP');
        error.statusCode = 400;
        error.errorCode = ErrorCodes.INVALID_OTP;
        throw error;
      }

      // Update user as verified
      const user = await User.findOneAndUpdate(
        { email },
        { email_verified: true },
        { new: true }
      );

      if (!user) {
        throw createAuthenticationError('User not found');
      }

      // Generate JWT token
      const token = jwtService.generateToken(user._id);

      // Send welcome email (don't await to avoid blocking response)
      emailService.sendWelcomeEmail(user.email, user.email.split('@')[0])
        .catch(err => console.error('Failed to send welcome email:', err));

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            plan_status: user.plan_status,
            email_verified: user.email_verified,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend OTP
  async resendOTP(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw createValidationError('Email is required');
      }

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        throw createAuthenticationError('User not found');
      }

      if (user.email_verified) {
        throw createValidationError('Email is already verified');
      }

      // Generate and send new OTP
      const otp = await otpService.createOTP(email);
      await otpService.sendOTP(email, otp);

      res.json({
        success: true,
        data: {
          message: 'OTP sent successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Login with email and password
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw createAuthenticationError('Invalid email or password');
      }

      // Check if OAuth user
      if (user.oauth_provider) {
        throw createAuthenticationError(
          'This account uses Google sign-in. Please use the Google login button.'
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw createAuthenticationError('Invalid email or password');
      }

      // Check email verification
      if (!user.email_verified) {
        // Resend OTP
        const otp = await otpService.createOTP(email);
        await otpService.sendOTP(email, otp);

        const error = new Error('Email not verified. A new OTP has been sent to your email.');
        error.statusCode = 403;
        error.errorCode = ErrorCodes.EMAIL_NOT_VERIFIED;
        throw error;
      }

      // Generate JWT token
      const token = jwtService.generateToken(user._id);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            plan_status: user.plan_status,
            email_verified: user.email_verified,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth login/signup
  async googleAuth(req, res, next) {
    try {
      const { idToken } = req.body;

      const result = await oauthService.authenticateWithGoogle(idToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async getMe(req, res, next) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            profile_image_url: user.profile_image_url,
            plan_status: user.plan_status,
            email_verified: user.email_verified,
            trial_started_at: user.trial_started_at,
            created_at: user.created_at,
            preferences: user.preferences || {
              currency: 'USD',
              name: null,
              monthly_budget: null,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user preferences
  async updatePreferences(req, res, next) {
    try {
      const user = req.user;
      const { currency, name, monthly_budget } = req.body;

      const updates = {};
      if (currency !== undefined) updates['preferences.currency'] = currency;
      if (name !== undefined) updates['preferences.name'] = name;
      if (monthly_budget !== undefined) updates['preferences.monthly_budget'] = monthly_budget;

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: {
          preferences: updatedUser.preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available currencies
  getCurrencies(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          currencies: CURRENCIES,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
