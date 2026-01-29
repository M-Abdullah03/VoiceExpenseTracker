const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');
const User = require('../models/User');
const jwtService = require('./jwtService');

class OAuthService {
  constructor() {
    // Initialize Google OAuth client only if credentials are configured
    if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
      this.googleClient = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_CALLBACK_URL
      );
    } else {
      this.googleClient = null;
      console.warn('⚠️  Google OAuth credentials not configured. Google sign-in will not work.');
      console.warn('   Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
      console.warn('   See GOOGLE_OAUTH_SETUP.md for setup instructions');
    }
  }

  async verifyGoogleToken(idToken) {
    if (!this.googleClient) {
      throw new Error('Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        email: payload.email,
        providerId: payload.sub,
        profileImage: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  async authenticateWithGoogle(idToken) {
    const googleData = await this.verifyGoogleToken(idToken);
    let isNewUser = false;

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { email: googleData.email },
        { oauth_provider: 'google', oauth_provider_id: googleData.providerId },
      ],
    });

    if (user) {
      // User exists - update if needed
      if (!user.oauth_provider) {
        // Email user exists, link Google account
        user.oauth_provider = 'google';
        user.oauth_provider_id = googleData.providerId;
        user.profile_image_url = googleData.profileImage;
        user.email_verified = true;
        await user.save();
      }
    } else {
      // Create new user
      isNewUser = true;
      user = await User.create({
        email: googleData.email,
        oauth_provider: 'google',
        oauth_provider_id: googleData.providerId,
        profile_image_url: googleData.profileImage,
        email_verified: true, // OAuth users don't need OTP verification
        plan_status: 'trial',
        trial_started_at: new Date(),
      });
    }

    // Generate JWT token
    const token = jwtService.generateToken(user._id);

    return {
      user: {
        id: user._id,
        email: user.email,
        profile_image_url: user.profile_image_url,
        plan_status: user.plan_status,
        email_verified: user.email_verified,
        preferences: user.preferences || {
          currency: 'USD',
          name: null,
          monthly_budget: null,
        },
      },
      token,
      isNewUser,
    };
  }
}

module.exports = new OAuthService();
