const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

// Public routes
router.get('/plans', paymentController.getPlans);
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.post('/create-session', authenticate, paymentController.createPaymentSession);

// Manual upgrade/downgrade for MVP testing
router.post('/upgrade-pro', authenticate, paymentController.upgradeToPro);
router.post('/downgrade-free', authenticate, paymentController.downgradeToFree);

module.exports = router;
