/**
 * Abstract AI Provider Interface
 * Implement this interface for different AI providers
 */
class AIProvider {
  /**
   * Parse transcription text into structured expenses
   * @param {string} transcription - The voice transcription text
   * @returns {Promise<Object>} - Parsed result with expenses array and metadata
   */
  async parseExpenses(transcription) {
    throw new Error('parseExpenses() must be implemented by subclass');
  }

  /**
   * Validate the confidence of parsed results
   * @param {Object} result - The parsed result
   * @returns {Object} - Validation result with isValid flag and optional clarificationQuestion
   */
  validateConfidence(result) {
    throw new Error('validateConfidence() must be implemented by subclass');
  }
}

module.exports = AIProvider;
