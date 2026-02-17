const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateGoogleToken,
} = require('../middleware/validate');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/verify-otp', validateOTP, authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', validateLogin, authController.login);
router.post('/google', validateGoogleToken, authController.googleAuth);
router.get('/currencies', authController.getCurrencies);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/preferences', authenticate, authController.updatePreferences);
router.put('/streak', authenticate, authController.updateStreak);

module.exports = router;
