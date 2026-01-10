const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JWTService {
  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new JWTService();
