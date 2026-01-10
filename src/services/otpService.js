const OTP = require('../models/OTP');
const config = require('../config/config');

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
    // In MVP, we'll just log to console
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('-----------------------------------');
    console.log(`OTP for ${email}: ${otp}`);
    console.log('-----------------------------------');

    // TODO: Integrate with email service
    // await emailService.send({
    //   to: email,
    //   subject: 'Your VoiceExpense Verification Code',
    //   text: `Your verification code is: ${otp}`,
    // });
  }
}

module.exports = new OTPService();
