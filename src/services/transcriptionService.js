const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/config');

class TranscriptionService {
  constructor() {
    this.groqApiKey = config.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
  }

  /**
   * Transcribe audio file using Groq's Whisper API
   * @param {string} audioFilePath - Path to the audio file
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudio(audioFilePath) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      console.log('Transcribing audio file:', audioFilePath);

      // Create form data with the audio file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      // Call Groq Whisper API
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.groqApiKey}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const transcription = response.data.text;
      console.log('Transcription result:', transcription);

      return transcription;
    } catch (error) {
      console.error('Transcription error:', error.response?.data || error.message);
      throw new Error('Failed to transcribe audio: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}

module.exports = new TranscriptionService();
