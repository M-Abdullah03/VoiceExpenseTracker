const Groq = require('groq-sdk');
const AIProvider = require('./AIProvider');
const config = require('../../config/config');
const { CATEGORIES } = require('../../models/Expense');
const { createAIProviderError, createClarificationError } = require('../../utils/errors');

class GroqProvider extends AIProvider {
  constructor() {
    super();
    this.client = new Groq({
      apiKey: config.GROQ_API_KEY,
    });
    this.model = config.GROQ_MODEL;
  }

  async parseExpenses(transcription) {
    try {
      const systemPrompt = `You are an expense parsing assistant. Extract structured expense data from voice transcriptions.

Rules:
- Extract ALL expenses mentioned in the transcription
- Return a JSON object with an "expenses" array
- Each expense must have: amount (number), category, date (ISO-8601), merchant (optional), notes (optional)
- Valid categories: ${CATEGORIES.join(', ')}
- If date is not mentioned, use today's date
- If you're unsure about any critical field (amount or category), set "needsClarification" to true and provide a "clarificationQuestion"
- Amount must be a positive number
- Be lenient with category matching (e.g., "coffee" -> "Food & Drink", "uber" -> "Transport")

Response format:
{
  "expenses": [
    {
      "amount": 45.50,
      "category": "Food & Drink",
      "date": "2026-01-09T12:00:00Z",
      "merchant": "Starbucks",
      "notes": "Coffee with team"
    }
  ],
  "confidence": "high" | "medium" | "low",
  "needsClarification": false,
  "clarificationQuestion": null
}`;

      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: transcription,
          },
        ],
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw createAIProviderError('No response from AI provider');
      }

      const parsed = JSON.parse(content);

      // Validate and normalize the response
      return this.normalizeResponse(parsed, transcription);
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      console.error('Groq API Error:', error);
      throw createAIProviderError(
        error.message || 'Failed to parse expenses with AI provider'
      );
    }
  }

  normalizeResponse(parsed, originalTranscription) {
    const expenses = parsed.expenses || [];

    // Normalize each expense
    const normalizedExpenses = expenses.map(expense => ({
      amount: parseFloat(expense.amount),
      category: this.normalizeCategory(expense.category),
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
      merchant: expense.merchant || null,
      notes: expense.notes || null,
      raw_transcription: originalTranscription,
    }));

    return {
      expenses: normalizedExpenses,
      confidence: parsed.confidence || 'medium',
      needsClarification: parsed.needsClarification || false,
      clarificationQuestion: parsed.clarificationQuestion || null,
    };
  }

  normalizeCategory(category) {
    // Try to match the category case-insensitively
    const normalized = CATEGORIES.find(
      cat => cat.toLowerCase() === category.toLowerCase()
    );

    return normalized || 'Other';
  }

  validateConfidence(result) {
    // Check if clarification is needed
    if (result.needsClarification && result.clarificationQuestion) {
      throw createClarificationError(result.clarificationQuestion);
    }

    // Validate expenses
    if (!result.expenses || result.expenses.length === 0) {
      throw createClarificationError(
        'No expenses could be extracted from the transcription. Could you please provide more details?'
      );
    }

    // Check for invalid amounts
    const invalidExpenses = result.expenses.filter(
      exp => !exp.amount || exp.amount <= 0
    );

    if (invalidExpenses.length > 0) {
      throw createClarificationError(
        'Some expenses have invalid amounts. Could you please clarify the amounts?'
      );
    }

    return {
      isValid: true,
    };
  }
}

module.exports = GroqProvider;
