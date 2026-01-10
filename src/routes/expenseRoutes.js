const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authenticate = require('../middleware/auth');
const { canModifyExpenses, requireEmailVerification } = require('../middleware/planGating');

// All expense routes require authentication and email verification
router.use(authenticate);
router.use(requireEmailVerification);

// AI parsing - requires plan check
router.post('/parse', canModifyExpenses, expenseController.parseTranscription);

// Create expenses - requires plan check
router.post('/', canModifyExpenses, expenseController.createExpenses);

// List and view expenses - available to all authenticated users (including expired trials)
router.get('/', expenseController.listExpenses);
router.get('/statistics', expenseController.getStatistics);
router.get('/:id', expenseController.getExpense);

// Update and delete - requires plan check
router.put('/:id', canModifyExpenses, expenseController.updateExpense);
router.delete('/:id', canModifyExpenses, expenseController.deleteExpense);

module.exports = router;
