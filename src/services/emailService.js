const axios = require('axios');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.apiKey = config.email.apiKey;
    this.fromEmail = config.email.from;
    this.baseURL = 'https://api.brevo.com/v3';
  }

  async sendEmail({ to, subject, htmlContent, textContent }) {
    if (!this.apiKey) {
      console.warn('Email API key not configured. Email not sent.');
      return false;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/smtp/email`,
        {
          sender: {
            email: this.fromEmail,
            name: 'VoiceExpense'
          },
          to: [
            {
              email: to
            }
          ],
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error.response?.data || error.message);
      return false;
    }
  }

  async sendOTPEmail(email, otp) {
    const subject = 'Your VoiceExpense Verification Code';
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>VoiceExpense</h1>
            <p>Email Verification</p>
          </div>
          <div style="padding: 30px; background-color: #f8f9fa;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p style="color: #666; font-size: 16px;">
              Thank you for signing up for VoiceExpense! To complete your registration, please use the verification code below:
            </p>
            <div style="background-color: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              This verification code will expire in 10 minutes for security purposes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this verification code, you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2026 VoiceExpense. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
VoiceExpense - Email Verification

Thank you for signing up for VoiceExpense!

Your verification code is: ${otp}

This verification code will expire in 10 minutes for security purposes.

If you didn't request this verification code, you can safely ignore this email.

© 2026 VoiceExpense. All rights reserved.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to VoiceExpense!';
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>VoiceExpense</h1>
            <p>Welcome aboard!</p>
          </div>
          <div style="padding: 30px; background-color: #f8f9fa;">
            <h2 style="color: #333;">Welcome to VoiceExpense, ${name}!</h2>
            <p style="color: #666; font-size: 16px;">
              We're excited to have you on board! VoiceExpense makes it easy to track your expenses using just your voice.
            </p>
            <h3 style="color: #333;">Getting Started:</h3>
            <ul style="color: #666;">
              <li>Record your expenses by voice</li>
              <li>Let our AI categorize and organize them</li>
              <li>View detailed reports and insights</li>
              <li>Export your data whenever needed</li>
            </ul>
            <p style="color: #666; font-size: 16px;">
              Start tracking your expenses today and take control of your finances!
            </p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2026 VoiceExpense. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to VoiceExpense, ${name}!

We're excited to have you on board! VoiceExpense makes it easy to track your expenses using just your voice.

Getting Started:
- Record your expenses by voice
- Let our AI categorize and organize them
- View detailed reports and insights
- Export your data whenever needed

Start tracking your expenses today and take control of your finances!

© 2026 VoiceExpense. All rights reserved.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }
}

module.exports = new EmailService();