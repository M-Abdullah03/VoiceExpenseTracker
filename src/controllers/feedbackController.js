const Feedback = require('../models/Feedback');

class FeedbackController {
  async submit(req, res, next) {
    try {
      const { category, rating, message } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ success: false, error: { message: 'Message is required' } });
      }

      const feedback = await Feedback.create({
        user_id: req.user._id,
        category: category || 'general',
        rating: rating || null,
        message: message.trim(),
      });

      res.status(201).json({ success: true, data: { id: feedback._id } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController();
