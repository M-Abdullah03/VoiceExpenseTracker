const OTP = require('../models/OTP');
const config = require('../config/config');
const emailService = require('./emailService');

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOTP(email) {
    const otp = this.generateOTP();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Create new OTP
    await OTP.create({
      email,
      otp,
    });

    return otp;
  }

  async verifyOTP(email, otp) {
    const otpRecord = await OTP.findOne({
      email,
      otp,
      expires_at: { $gt: new Date() },
    });

    if (!otpRecord) {
      return false;
    }

    // Delete the OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    return true;
  }

  async sendOTP(email, otp) {
    try {
      // Send email using Brevo service
      const emailSent = await emailService.sendOTPEmail(email, otp);
      
      if (!emailSent) {
        // Fallback to console logging if email fails
        console.log('-----------------------------------');
        console.log(`OTP for ${email}: ${otp}`);
        console.log('-----------------------------------');
      }
      
      return emailSent;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // Fallback to console logging
      console.log('-----------------------------------');
      console.log(`OTP for ${email}: ${otp}`);
      console.log('-----------------------------------');
      return false;
    }
  }
}

module.exports = new OTPService();
