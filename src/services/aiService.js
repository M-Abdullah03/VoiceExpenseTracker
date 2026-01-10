const GroqProvider = require('./ai/GroqProvider');
const AIUsage = require('../models/AIUsage');
const config = require('../config/config');
const { createRateLimitError, createValidationError } = require('../utils/errors');

class AIService {
  constructor() {
    // Use Groq as the AI provider
    // Can be easily swapped with other providers
    this.provider = new GroqProvider();
  }

  async parseExpenses(transcription, user) {
    // Validate transcription length
    if (!transcription || transcription.trim().length === 0) {
      throw createValidationError('Transcription cannot be empty');
    }

    if (transcription.length > config.MAX_TRANSCRIPTION_LENGTH) {
      throw createValidationError(
        `Transcription exceeds maximum length of ${config.MAX_TRANSCRIPTION_LENGTH} characters`
      );
    }

    // Check rate limit
    await this.checkRateLimit(user);

    // Parse expenses using the AI provider
    const result = await this.provider.parseExpenses(transcription);

    // Validate confidence
    this.provider.validateConfidence(result);

    // Increment usage count
    await this.incrementUsage(user);

    return result;
  }

  async checkRateLimit(user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's usage
    const usage = await AIUsage.findOne({
      user_id: user._id,
      date: today,
    });

    const currentCount = usage ? usage.count : 0;

    // Get limit based on plan
    let limit;
    switch (user.plan_status) {
      case 'trial':
        limit = config.AI_PARSE_RATE_LIMIT_TRIAL;
        break;
      case 'free':
        limit = config.AI_PARSE_RATE_LIMIT_FREE;
        break;
      case 'pro':
        limit = config.AI_PARSE_RATE_LIMIT_PRO;
        break;
      default:
        limit = config.AI_PARSE_RATE_LIMIT_FREE;
    }

    if (currentCount >= limit) {
      throw createRateLimitError();
    }
  }

  async incrementUsage(user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await AIUsage.findOneAndUpdate(
      {
        user_id: user._id,
        date: today,
      },
      {
        $inc: { count: 1 },
      },
      {
        upsert: true,
      }
    );
  }

  async getRemainingParses(user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await AIUsage.findOne({
      user_id: user._id,
      date: today,
    });

    const currentCount = usage ? usage.count : 0;

    let limit;
    switch (user.plan_status) {
      case 'trial':
        limit = config.AI_PARSE_RATE_LIMIT_TRIAL;
        break;
      case 'free':
        limit = config.AI_PARSE_RATE_LIMIT_FREE;
        break;
      case 'pro':
        limit = config.AI_PARSE_RATE_LIMIT_PRO;
        break;
      default:
        limit = config.AI_PARSE_RATE_LIMIT_FREE;
    }

    return {
      used: currentCount,
      limit: limit,
      remaining: Math.max(0, limit - currentCount),
    };
  }
}

module.exports = new AIService();
