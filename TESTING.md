# Testing Guide

This guide explains how to test the VoiceExpense backend API.

## Test Files

We provide two test files:

1. **test-e2e.js** - Interactive end-to-end test with manual OTP verification
2. **test-auto.js** - Fully automated test that bypasses OTP (for CI/CD)

## Prerequisites

Before running tests:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Configure MongoDB URI
   - Add Groq API key (REQUIRED for AI tests)
   - Other variables can use defaults

3. **Start the server**

   In one terminal:
   ```bash
   npm run dev
   ```

   Wait for the message: "Server running on port 5000..."

## Running Tests

### Interactive Test (Recommended for Development)

This test requires you to enter the OTP from the server console.

```bash
npm test
```

Or:
```bash
node test-e2e.js
```

**Steps:**
1. The test will register a new user
2. Check the server console for the OTP (6-digit code)
3. Enter the OTP when prompted
4. The test will continue automatically

**What it tests:**
- ✅ Health check
- ✅ User registration
- ✅ OTP verification
- ✅ Email/password login
- ✅ Get user profile
- ✅ AI transcription parsing
- ✅ Create expenses
- ✅ List expenses (with and without filters)
- ✅ Get expense statistics
- ✅ Get single expense
- ✅ Update expense
- ✅ Create manual expense
- ✅ Delete expense
- ✅ Get payment plans
- ✅ Upgrade to Pro
- ✅ Parse complex multi-expense transcription
- ✅ Final statistics summary

### Automated Test (For CI/CD)

This test creates a verified user directly in the database and runs automatically.

```bash
npm run test:auto
```

Or:
```bash
node test-auto.js
```

**What it does:**
- Connects to MongoDB directly
- Creates a pre-verified test user
- Runs the full test suite
- Cleans up test data
- Exits with code 0 (success) or 1 (failure)

**Use cases:**
- Continuous Integration (CI/CD pipelines)
- Automated testing workflows
- Quick validation without manual input

## Test Output

Both tests provide colored output:

- 🟢 **Green** - Success messages
- 🔵 **Blue** - Information
- 🟡 **Yellow** - Warnings or notes
- 🔴 **Red** - Errors

### Sample Output

```
======================================================================
STEP 1: Health Check
======================================================================
✓ Server is healthy
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-09T...",
    "environment": "development"
  }
}

======================================================================
STEP 2: Register New User
======================================================================
Email: test-1704823456789@example.com
Password: password123
✓ User registered successfully
...

======================================================================
  TEST SUMMARY
======================================================================

Total Tests: 18
Passed: 18
Failed: 0
Duration: 12.34s
Success Rate: 100.0%

🎉 All tests passed! The API is working correctly.
```

## Testing Individual Endpoints

You can also test individual endpoints using curl or tools like Postman.

### Example: Register and Login Flow

1. **Register a user**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Check server console for OTP** (e.g., "123456")

3. **Verify OTP**
   ```bash
   curl -X POST http://localhost:5000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456"}'
   ```

4. **Save the token** from the response

5. **Use the token for authenticated requests**
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Example: AI Parsing and Expense Creation

1. **Parse transcription**
   ```bash
   curl -X POST http://localhost:5000/api/expenses/parse \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"transcription":"I spent $45 at Starbucks and $120 on groceries"}'
   ```

2. **Create expenses from parsed data**
   ```bash
   curl -X POST http://localhost:5000/api/expenses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "expenses": [
         {
           "amount": 45,
           "category": "Food & Drink",
           "merchant": "Starbucks"
         }
       ]
     }'
   ```

3. **List expenses**
   ```bash
   curl -X GET http://localhost:5000/api/expenses \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Common Issues

### Test fails at Health Check
- **Issue**: Server is not running
- **Solution**: Start the server with `npm run dev` in a separate terminal

### Test fails at OTP Verification
- **Issue**: Entered wrong OTP or OTP expired
- **Solution**: OTPs expire after 10 minutes. Check server console for the correct OTP

### Test fails at AI Parsing
- **Issue**: Groq API key is missing or invalid
- **Solution**:
  - Ensure `GROQ_API_KEY` is set in `.env`
  - Get a valid key from https://console.groq.com
  - Check your API quota

### Test fails at Database Connection (automated test)
- **Issue**: MongoDB is not running or connection string is incorrect
- **Solution**:
  - For local: Ensure MongoDB is running (`mongod`)
  - For Atlas: Check connection string in `.env`
  - Verify network connectivity

### Rate Limit Exceeded
- **Issue**: You've exceeded the daily AI parsing limit
- **Solution**:
  - Wait 24 hours for the limit to reset
  - Increase the limit in `.env` (for testing):
    ```
    AI_PARSE_RATE_LIMIT_TRIAL=100
    ```
  - Upgrade to Pro (manual test endpoint):
    ```bash
    curl -X POST http://localhost:5000/api/payments/upgrade-pro \
      -H "Authorization: Bearer YOUR_TOKEN"
    ```

## Testing Plan Gating

### Test Trial Expiry

To test what happens when a trial expires:

1. **Set trial duration to 0 in `.env`**
   ```env
   TRIAL_DURATION_DAYS=0
   ```

2. **Restart the server**
   ```bash
   npm run dev
   ```

3. **Register a new user and verify email**

4. **Try to create an expense** - should get `TRIAL_EXPIRED` error:
   ```bash
   curl -X POST http://localhost:5000/api/expenses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "expenses": [{"amount": 50, "category": "Other"}]
     }'
   ```

5. **Expected response**:
   ```json
   {
     "success": false,
     "error": {
       "code": "TRIAL_EXPIRED",
       "message": "Your trial has expired. Please upgrade to continue creating expenses."
     }
   }
   ```

6. **Reset trial duration** back to 14 days

### Test Free vs Pro Access

1. **Downgrade to Free**
   ```bash
   curl -X POST http://localhost:5000/api/payments/downgrade-free \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Try to create expense** - should get `AUTHORIZATION_ERROR`

3. **Try to view expenses** - should succeed (free users can view)

4. **Upgrade to Pro**
   ```bash
   curl -X POST http://localhost:5000/api/payments/upgrade-pro \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Try to create expense** - should succeed

## Test Coverage

The test files cover:

- ✅ Authentication (register, login, OTP, OAuth)
- ✅ User profile management
- ✅ AI transcription parsing
- ✅ Expense CRUD operations
- ✅ Filtering and pagination
- ✅ Statistics and analytics
- ✅ Plan gating (trial/free/pro)
- ✅ Rate limiting
- ✅ Error handling
- ✅ Payment plans (stubbed)

## Performance Testing

For load testing, consider using tools like:

- **Artillery**: `npm install -g artillery`
- **Apache Bench (ab)**: Built into most systems
- **k6**: Modern load testing tool

### Example Artillery Test

Create `artillery-test.yml`:
```yaml
config:
  target: http://localhost:5000
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Health Check"
    flow:
      - get:
          url: "/health"
```

Run:
```bash
artillery run artillery-test.yml
```

## Continuous Integration

For CI/CD pipelines (GitHub Actions, GitLab CI, etc.):

```yaml
# Example GitHub Actions workflow
name: Test API

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm install
      - run: npm run dev &
      - run: sleep 5
      - run: npm run test:auto

    env:
      MONGODB_URI: mongodb://localhost:27017/voiceexpense-test
      JWT_SECRET: test-secret-key
      GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

## Best Practices

1. **Always run tests before deploying** to production
2. **Use automated tests** in CI/CD pipelines
3. **Keep test data separate** from production data
4. **Monitor test execution time** - tests should complete in < 30 seconds
5. **Check test coverage** regularly and add tests for new features
6. **Clean up test data** after tests complete
7. **Use environment-specific configs** for testing

## Contributing Tests

When adding new features:

1. Add test cases to `test-e2e.js` and `test-auto.js`
2. Update this TESTING.md with new test instructions
3. Ensure all tests pass before submitting PR
4. Document any new testing requirements

## Need Help?

If you encounter issues with testing:

1. Check this guide first
2. Review error messages carefully
3. Check server logs for detailed error information
4. Ensure all prerequisites are met
5. Try the automated test if the interactive test fails
6. Create an issue with test output if problems persist
