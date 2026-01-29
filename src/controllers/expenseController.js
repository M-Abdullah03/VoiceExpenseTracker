const { Expense, CATEGORIES } = require('../models/Expense');
const aiService = require('../services/aiService');
const transcriptionService = require('../services/transcriptionService');
const config = require('../config/config');
const { createNotFoundError, createValidationError } = require('../utils/errors');
const fs = require('fs').promises;

class ExpenseController {
  // Parse transcription using AI (accepts text or audio file)
  async parseTranscription(req, res, next) {
    let tempFilePath = null;

    try {
      const user = req.user;
      let transcription = req.body.transcription;

      // If audio file is uploaded, transcribe it first
      if (req.file) {
        console.log('Audio file uploaded:', req.file.originalname);
        tempFilePath = req.file.path;

        // Transcribe audio using Groq Whisper
        transcription = await transcriptionService.transcribeAudio(tempFilePath);

        if (!transcription || transcription.trim().length === 0) {
          throw createValidationError('No speech detected in the audio file');
        }
      }

      // Validate transcription
      if (!transcription) {
        throw createValidationError('Transcription or audio file is required');
      }

      console.log('Processing transcription:', transcription);

      // Parse expenses using AI service
      const result = await aiService.parseExpenses(transcription, user);

      // Get remaining parses for the user
      const usage = await aiService.getRemainingParses(user);

      res.json({
        success: true,
        data: {
          expenses: result.expenses,
          confidence: result.confidence,
          usage: usage,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log('Cleaned up temp file:', tempFilePath);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }
    }
  }

  // Create expense(s)
  async createExpenses(req, res, next) {
    try {
      const { expenses } = req.body;
      const user = req.user;

      if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        throw createValidationError('Expenses array is required and must not be empty');
      }

      // Validate each expense
      expenses.forEach((expense, index) => {
        if (!expense.amount || expense.amount <= 0) {
          throw createValidationError(`Expense at index ${index}: amount is required and must be positive`);
        }
        if (!expense.category || !CATEGORIES.includes(expense.category)) {
          throw createValidationError(`Expense at index ${index}: valid category is required`);
        }
      });

      // Create expenses
      const createdExpenses = await Expense.insertMany(
        expenses.map(expense => ({
          ...expense,
          user_id: user._id,
          date: expense.date ? new Date(expense.date) : new Date(),
        }))
      );

      res.status(201).json({
        success: true,
        data: {
          expenses: createdExpenses,
          count: createdExpenses.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // List expenses with filtering and pagination
  async listExpenses(req, res, next) {
    try {
      const user = req.user;
      const {
        startDate,
        endDate,
        category,
        minAmount,
        maxAmount,
        limit = config.DEFAULT_PAGE_SIZE,
        offset = 0,
      } = req.query;

      // Build query
      const query = { user_id: user._id };

      // Date range filter
      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          query.date.$gte = new Date(startDate);
        }
        if (endDate) {
          query.date.$lte = new Date(endDate);
        }
      }

      // Category filter
      if (category) {
        if (!CATEGORIES.includes(category)) {
          throw createValidationError(`Invalid category. Valid categories: ${CATEGORIES.join(', ')}`);
        }
        query.category = category;
      }

      // Amount range filter
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) {
          query.amount.$gte = parseFloat(minAmount);
        }
        if (maxAmount) {
          query.amount.$lte = parseFloat(maxAmount);
        }
      }

      // Parse pagination params
      const limitNum = Math.min(parseInt(limit, 10), config.MAX_PAGE_SIZE);
      const offsetNum = parseInt(offset, 10);

      // Get total count
      const total = await Expense.countDocuments(query);

      // Get expenses
      const expenses = await Expense.find(query)
        .sort({ date: -1, created_at: -1 })
        .limit(limitNum)
        .skip(offsetNum);

      res.json({
        success: true,
        data: {
          expenses,
          pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single expense
  async getExpense(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      const expense = await Expense.findOne({
        _id: id,
        user_id: user._id,
      });

      if (!expense) {
        throw createNotFoundError('Expense');
      }

      res.json({
        success: true,
        data: {
          expense,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update expense
  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;
      const updates = req.body;

      // Validate updates
      if (updates.amount && updates.amount <= 0) {
        throw createValidationError('Amount must be positive');
      }

      if (updates.category && !CATEGORIES.includes(updates.category)) {
        throw createValidationError(`Invalid category. Valid categories: ${CATEGORIES.join(', ')}`);
      }

      // Find and update expense
      const expense = await Expense.findOneAndUpdate(
        {
          _id: id,
          user_id: user._id,
        },
        updates,
        { new: true, runValidators: true }
      );

      if (!expense) {
        throw createNotFoundError('Expense');
      }

      res.json({
        success: true,
        data: {
          expense,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete expense
  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      const expense = await Expense.findOneAndDelete({
        _id: id,
        user_id: user._id,
      });

      if (!expense) {
        throw createNotFoundError('Expense');
      }

      res.json({
        success: true,
        data: {
          message: 'Expense deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get expense statistics
  async getStatistics(req, res, next) {
    try {
      const user = req.user;
      const { startDate, endDate } = req.query;

      // Build match query
      const matchQuery = { user_id: user._id };

      if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) {
          matchQuery.date.$gte = new Date(startDate);
        }
        if (endDate) {
          matchQuery.date.$lte = new Date(endDate);
        }
      }

      // Get statistics
      const stats = await Expense.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]);

      // Calculate overall total
      const overallTotal = stats.reduce((sum, stat) => sum + stat.total, 0);

      res.json({
        success: true,
        data: {
          byCategory: stats.map(stat => ({
            category: stat._id,
            total: stat.total,
            count: stat.count,
          })),
          overallTotal,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
