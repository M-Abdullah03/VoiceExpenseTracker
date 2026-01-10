const User = require('../models/User');

class PaymentController {
  // Get available plans
  async getPlans(req, res, next) {
    try {
      const plans = [
        {
          id: 'monthly',
          name: 'Pro Monthly',
          price: 9.99,
          currency: 'USD',
          interval: 'month',
          features: [
            'Unlimited AI parsing',
            'Unlimited expense tracking',
            'Advanced analytics',
            'Priority support',
          ],
        },
        {
          id: 'annual',
          name: 'Pro Annual',
          price: 99.99,
          currency: 'USD',
          interval: 'year',
          features: [
            'Unlimited AI parsing',
            'Unlimited expense tracking',
            'Advanced analytics',
            'Priority support',
            'Save 17% vs monthly',
          ],
        },
      ];

      res.json({
        success: true,
        data: {
          plans,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create payment session (stubbed for MVP)
  async createPaymentSession(req, res, next) {
    try {
      const { planId } = req.body;
      const user = req.user;

      // TODO: Integrate with payment provider (Stripe, etc.)
      // For MVP, this is stubbed

      res.json({
        success: true,
        data: {
          message: 'Payment integration is not yet implemented',
          sessionId: 'stub_session_id',
          checkoutUrl: 'https://example.com/checkout',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle payment webhook (stubbed for MVP)
  async handleWebhook(req, res, next) {
    try {
      // TODO: Integrate with payment provider webhooks
      // Verify webhook signature
      // Update user plan status

      res.json({
        success: true,
        data: {
          message: 'Webhook received',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Upgrade to pro (manual for MVP - for testing)
  async upgradeToPro(req, res, next) {
    try {
      const user = req.user;

      user.plan_status = 'pro';
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'Successfully upgraded to Pro',
          user: {
            id: user._id,
            email: user.email,
            plan_status: user.plan_status,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Downgrade to free (manual for MVP - for testing)
  async downgradeToFree(req, res, next) {
    try {
      const user = req.user;

      user.plan_status = 'free';
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'Plan changed to Free',
          user: {
            id: user._id,
            email: user.email,
            plan_status: user.plan_status,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
