CLAUDE CODE PROMPT — BACKEND GENERATION

You are a senior backend engineer.

Generate a production-ready MVP backend for a voice-first expense tracking app.

The backend will be consumed only by an Expo (React Native) client.

Use the following stack exactly:

Node.js

Express.js

MongoDB (Mongoose, targeting MongoDB Atlas)

JWT authentication

OAuth 2.0 (Google only)

Groq API for LLM calls

Do NOT introduce additional technologies unless explicitly required.

1. Authentication & Users
Auth Methods

Email + password

OAuth 2.0 (Google only)

Single OAuth button for login/signup

Backend determines whether to create or log in a user

Email Rules

Email is required for all users

Email + password users must verify email via OTP

OAuth users do NOT require OTP

User Model

Include at minimum:

email (unique, required)

password_hash (nullable for OAuth users)

oauth_provider (google, nullable)

oauth_provider_id (nullable)

profile_image_url (nullable)

plan_status: trial | free | pro

trial_started_at

created_at

2. Authentication Tokens

Use JWT

Long-lived access tokens

JWT passed via request headers

No refresh tokens in MVP

3. Trial, Free & Pro Gating

New users start in trial

Trial duration stored in config (default: 14 days, not hardcoded)

After trial expiry:

User can view expenses

User cannot create or edit expenses

Payment plans:

Monthly

Annual

Payment implementation is stubbed

Gating enforced via Express middleware

4. Expense Model

Expense fields:

user_id

amount (number, required, > 0)

category (enum, required)

date (ISO-8601, default now)

merchant (optional)

notes (optional)

raw_transcription (stored)

created_at

Categories are fixed:

Food & Drink

Groceries

Transport

Rent

Entertainment

Other

5. Expense APIs

Implement:

Create expense(s)

List expenses

Update expense

Delete expense

List endpoint must support optional query params:

date range

category

amount range

pagination / limit

All expense access must be scoped to the authenticated user.

6. AI Parsing Pipeline (Groq)

Frontend sends a single transcription string

Transcription may contain multiple expenses

Backend must:

Send text to Groq LLM

Extract an array of structured expenses

Validate schema server-side

Return structured preview (no auto-save)

Backend must support:

Confidence scoring

At most one clarification question

No silent failures

7. AI Abstraction Layer

Create a provider-agnostic AI service:

parseExpenses(text)

validateConfidence(result)

Groq implementation must be isolated behind this interface.

8. Concurrency & Performance

Backend must handle ~50 concurrent users

Use async / non-blocking patterns

No shared mutable state in AI pipeline

No background jobs or queues in MVP

9. Rate Limiting & Abuse Control

Per-user rate limits for AI parsing

Enforced especially for trial/free users

Max transcription length enforced

10. Error Handling

Return structured error responses with clear codes:

TRIAL_EXPIRED

CLARIFICATION_REQUIRED

VALIDATION_ERROR

AI_PROVIDER_ERROR

RATE_LIMIT_EXCEEDED

No generic “something went wrong” messages.

11. Project Structure

Generate:

Clean folder structure

Config files

Models

Controllers

Routes

Middleware

Services (AI, auth, payments stub)