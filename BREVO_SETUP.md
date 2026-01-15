# Brevo Email Integration

This project uses [Brevo](https://www.brevo.com) (formerly Sendinblue) for email functionality, including OTP verification emails and welcome emails.

## Setup

### 1. Get Brevo API Key

1. Sign up or log in to [Brevo](https://app.brevo.com)
2. Go to **Settings** > **SMTP & API** > **API Keys**
3. Create a new API key or copy an existing one
4. Add it to your `.env` file:

```env
EMAIL_API_KEY=your-brevo-api-key-here
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Configure Sender Email

Make sure you have:
- A verified sender email address in Brevo
- Updated the `EMAIL_FROM` environment variable to match your verified sender

### 3. Test the Integration

The email service will automatically fall back to console logging if:
- No API key is provided
- API calls fail
- Network issues occur

## Email Templates

### OTP Verification Email
- Sent during user registration
- Contains a 6-digit verification code
- Expires in 10 minutes
- Professional HTML template with brand colors

### Welcome Email
- Sent after successful email verification
- Introduces the user to VoiceExpense features
- Provides getting started tips

## API Endpoints

The following endpoints trigger email sending:

- `POST /api/auth/register` - Sends OTP verification email
- `POST /api/auth/resend-otp` - Resends OTP verification email
- `POST /api/auth/verify-otp` - Sends welcome email after successful verification

## Email Service Methods

### `emailService.sendOTPEmail(email, otp)`
Sends a formatted OTP verification email.

### `emailService.sendWelcomeEmail(email, name)`
Sends a welcome email after successful registration.

### `emailService.sendEmail(options)`
Generic email sending method for custom emails:

```javascript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Subject',
  htmlContent: '<h1>HTML Content</h1>',
  textContent: 'Plain text content'
});
```

## Error Handling

- Failed email sends are logged to console
- System falls back to console OTP display if email fails
- Non-blocking email sends (welcome emails) won't affect user experience

## Development vs Production

- **Development**: If no API key is set, emails are logged to console
- **Production**: Real emails are sent via Brevo API

## Brevo Documentation

For more advanced features, refer to:
- [Brevo API Documentation](https://developers.brevo.com/docs/quickstart)
- [Email API Reference](https://developers.brevo.com/reference/sendtransacemail)

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check that your API key is correct
   - Ensure it has email sending permissions

2. **Sender Not Verified**
   - Verify your sender email in Brevo dashboard
   - Update `EMAIL_FROM` to match verified sender

3. **Rate Limits**
   - Free plans have sending limits
   - Monitor usage in Brevo dashboard

4. **Emails Not Received**
   - Check spam folders
   - Verify recipient email addresses
   - Check Brevo logs for delivery status