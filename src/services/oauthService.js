const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');
const User = require('../models/User');
const jwtService = require('./jwtService');

class OAuthService {
  constructor() {
    this.googleClient = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_CALLBACK_URL
    );
  }

  async verifyGoogleToken(idToken) {
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
      user = await User.create({
        email: googleData.email,
        oauth_provider: 'google',
        oauth_provider_id: googleData.providerId,
        profile_image_url: googleData.profileImage,
        email_verified: true, // OAuth users don't need OTP verification
        plan_status: 'trial',
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
      },
      token,
    };
  }
}

module.exports = new OAuthService();
