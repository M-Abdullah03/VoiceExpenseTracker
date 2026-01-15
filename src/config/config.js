require('dotenv').config();

const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceexpense',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',

  // OAuth Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',

  // Groq AI
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Trial & Plans
  TRIAL_DURATION_DAYS: parseInt(process.env.TRIAL_DURATION_DAYS || '14', 10),

  // Rate Limiting
  AI_PARSE_RATE_LIMIT_TRIAL: parseInt(process.env.AI_PARSE_RATE_LIMIT_TRIAL || '10', 10), // per day
  AI_PARSE_RATE_LIMIT_FREE: parseInt(process.env.AI_PARSE_RATE_LIMIT_FREE || '10', 10), // per day
  AI_PARSE_RATE_LIMIT_PRO: parseInt(process.env.AI_PARSE_RATE_LIMIT_PRO || '1000', 10), // per day
  MAX_TRANSCRIPTION_LENGTH: parseInt(process.env.MAX_TRANSCRIPTION_LENGTH || '5000', 10),

  // Email configuration
  email: {
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@voiceexpense.com',
  },

  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '50', 10),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
};

module.exports = config;
