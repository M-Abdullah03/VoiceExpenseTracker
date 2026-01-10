# VoiceExpense Backend

Production-ready MVP backend for a voice-first expense tracking app.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose, targeting MongoDB Atlas)
- **Authentication**: JWT + OAuth 2.0 (Google)
- **AI Provider**: Groq API

## Features

### Authentication & Users
- Email + password registration with OTP verification
- OAuth 2.0 (Google) login/signup
- JWT-based authentication
- Trial, Free, and Pro plan management
- Email verification for password-based users

### Expense Management
- CRUD operations for expenses
- Fixed categories: Food & Drink, Groceries, Transport, Rent, Entertainment, Other
- Filtering by date range, category, and amount
- Pagination support
- Expense statistics and analytics

### AI Parsing
- Voice transcription to structured expense data using Groq
- Multiple expense extraction from single transcription
- Confidence scoring and clarification questions
- Provider-agnostic AI abstraction layer
- Rate limiting per user plan

### Plan Gating
- Trial users: 14 days (configurable) with full access
- Free users: View only, no create/edit
- Pro users: Unlimited access
- Trial expiry enforcement via middleware

## Project Structure

```
VoiceExpense/
├── src/
│   ├── config/
│   │   ├── config.js           # Configuration management
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User model with plan management
│   │   ├── Expense.js          # Expense model
│   │   ├── OTP.js              # OTP for email verification
│   │   └── AIUsage.js          # AI parsing usage tracking
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── expenseController.js # Expense operations
│   │   └── paymentController.js # Payment plans (stubbed)
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── expenseRoutes.js    # Expense endpoints
│   │   └── paymentRoutes.js    # Payment endpoints
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── planGating.js       # Plan-based access control
│   │   ├── validate.js         # Request validation
│   │   └── errorHandler.js     # Global error handling
│   ├── services/
│   │   ├── jwtService.js       # JWT token management
│   │   ├── otpService.js       # OTP generation and verification
│   │   ├── oauthService.js     # Google OAuth integration
│   │   ├── aiService.js        # AI parsing service
│   │   └── ai/
│   │       ├── AIProvider.js   # Abstract AI provider interface
│   │       └── GroqProvider.js # Groq implementation
│   └── utils/
│       └── errors.js           # Error classes and creators
├── server.js                   # Express app entry point
├── package.json                # Dependencies
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or MongoDB Atlas)
- Groq API key (get from https://console.groq.com)
- Google OAuth credentials (optional, for OAuth login)

### Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/voiceexpense
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/voiceexpense

   # JWT
   JWT_SECRET=your-secure-secret-key-here
   JWT_EXPIRES_IN=30d

   # Groq AI (REQUIRED)
   GROQ_API_KEY=your-groq-api-key-here
   GROQ_MODEL=mixtral-8x7b-32768

   # Google OAuth (OPTIONAL)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # Trial & Plans
   TRIAL_DURATION_DAYS=14

   # Rate Limiting
   AI_PARSE_RATE_LIMIT_TRIAL=10
   AI_PARSE_RATE_LIMIT_FREE=10
   AI_PARSE_RATE_LIMIT_PRO=1000
   MAX_TRANSCRIPTION_LENGTH=5000
   ```

4. **Start the server**

   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

5. **Verify the server is running**

   Visit http://localhost:5000/health

   You should see:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "timestamp": "2026-01-09T...",
       "environment": "development"
     }
   }
   ```

## Testing the Backend

We provide comprehensive end-to-end tests to verify the API is working correctly.

### Quick Test

Run the interactive test (requires manual OTP entry):

```bash
npm test
```

This will:
1. Register a new user
2. Ask you to enter the OTP from the server console
3. Test all major API endpoints
4. Show a detailed test report

### Automated Test

For CI/CD or automated testing:

```bash
npm run test:auto
```

This test runs without manual input and is perfect for continuous integration.

### Full Testing Guide

For detailed testing instructions, see [TESTING.md](./TESTING.md).

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register with email/password | No |
| POST | `/api/auth/verify-otp` | Verify email with OTP | No |
| POST | `/api/auth/resend-otp` | Resend OTP | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/google` | Login/signup with Google | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Expenses

| Method | Endpoint | Description | Auth Required | Plan Gating |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/expenses/parse` | Parse transcription with AI | Yes | Create access |
| POST | `/api/expenses` | Create expense(s) | Yes | Create access |
| GET | `/api/expenses` | List expenses | Yes | View access |
| GET | `/api/expenses/statistics` | Get statistics | Yes | View access |
| GET | `/api/expenses/:id` | Get single expense | Yes | View access |
| PUT | `/api/expenses/:id` | Update expense | Yes | Create access |
| DELETE | `/api/expenses/:id` | Delete expense | Yes | Create access |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payments/plans` | Get available plans | No |
| POST | `/api/payments/create-session` | Create payment session (stubbed) | Yes |
| POST | `/api/payments/upgrade-pro` | Manual upgrade to Pro (testing) | Yes |
| POST | `/api/payments/downgrade-free` | Manual downgrade to Free (testing) | Yes |

## API Usage Examples

### 1. Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent to you.",
    "email": "user@example.com"
  }
}
```

Check console for OTP (in MVP, OTPs are logged to console).

### 2. Verify OTP

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "plan_status": "trial",
      "email_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Save the token for subsequent requests.

### 3. Parse voice transcription

```bash
curl -X POST http://localhost:5000/api/expenses/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "transcription": "I spent $45.50 at Starbucks for coffee with the team, and $120 on groceries at Whole Foods"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "amount": 45.50,
        "category": "Food & Drink",
        "date": "2026-01-09T12:00:00Z",
        "merchant": "Starbucks",
        "notes": "coffee with the team",
        "raw_transcription": "I spent $45.50..."
      },
      {
        "amount": 120,
        "category": "Groceries",
        "date": "2026-01-09T12:00:00Z",
        "merchant": "Whole Foods",
        "notes": null,
        "raw_transcription": "I spent $45.50..."
      }
    ],
    "confidence": "high",
    "usage": {
      "used": 1,
      "limit": 10,
      "remaining": 9
    }
  }
}
```

### 4. Create expenses

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "expenses": [
      {
        "amount": 45.50,
        "category": "Food & Drink",
        "merchant": "Starbucks",
        "notes": "coffee with team"
      }
    ]
  }'
```

### 5. List expenses with filters

```bash
curl -X GET "http://localhost:5000/api/expenses?category=Food%20%26%20Drink&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Error Handling

All errors follow a structured format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Error Codes

- `TRIAL_EXPIRED` - User's trial has expired
- `CLARIFICATION_REQUIRED` - AI needs clarification
- `VALIDATION_ERROR` - Input validation failed
- `AI_PROVIDER_ERROR` - AI service error
- `RATE_LIMIT_EXCEEDED` - Daily AI parsing limit reached
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already registered
- `INVALID_OTP` - Invalid or expired OTP
- `EMAIL_NOT_VERIFIED` - Email verification required

## Development Notes

### OTP Delivery

In the MVP, OTPs are logged to the console. To integrate with an email service:

1. Choose a service (SendGrid, AWS SES, Mailgun, etc.)
2. Update `src/services/otpService.js` in the `sendOTP()` method
3. Add email service credentials to `.env`

### Payment Integration

Payment functionality is stubbed in the MVP. To integrate:

1. Choose a payment provider (Stripe recommended)
2. Implement `src/controllers/paymentController.js`
3. Set up webhooks for payment status updates
4. Add provider credentials to `.env`

### AI Provider

The AI service uses an abstraction layer. To switch providers:

1. Create a new provider class extending `AIProvider`
2. Implement `parseExpenses()` and `validateConfidence()`
3. Update `src/services/aiService.js` to use your provider

### Rate Limiting

AI parsing rate limits are enforced per user plan. Adjust limits in `.env`:

- `AI_PARSE_RATE_LIMIT_TRIAL` - Trial users (default: 10/day)
- `AI_PARSE_RATE_LIMIT_FREE` - Free users (default: 10/day)
- `AI_PARSE_RATE_LIMIT_PRO` - Pro users (default: 1000/day)

## Testing the Backend

### Manual Plan Testing

Upgrade a user to Pro:
```bash
curl -X POST http://localhost:5000/api/payments/upgrade-pro \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Downgrade to Free:
```bash
curl -X POST http://localhost:5000/api/payments/downgrade-free \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing Trial Expiry

To test trial expiry without waiting 14 days:

1. Temporarily set `TRIAL_DURATION_DAYS=0` in `.env`
2. Register a new user
3. Try to create an expense - should get `TRIAL_EXPIRED` error

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:
- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET`
- Configure `ALLOWED_ORIGINS` for CORS
- Use MongoDB Atlas connection string
- Set up proper email service

### Security Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting at API gateway level
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring and logging
- [ ] Implement proper backup strategy

## License

MIT
