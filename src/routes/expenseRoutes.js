const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authenticate = require('../middleware/auth');
const { canModifyExpenses, requireEmailVerification } = require('../middleware/planGating');

// Configure multer storage to preserve file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.m4a'; // Default to .m4a if no extension
    cb(null, 'recording-' + uniqueSuffix + ext);
  }
});

// Configure multer for audio file uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size (Groq Whisper limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a',
      'audio/webm',
      'audio/ogg',
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|mp4|webm|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file format. Supported formats: mp3, wav, m4a, mp4, webm, ogg'));
    }
  },
});

// All expense routes require authentication and email verification
router.use(authenticate);
router.use(requireEmailVerification);

// AI parsing - requires plan check (accepts both text transcription and audio file)
router.post('/parse', canModifyExpenses, upload.single('audio'), expenseController.parseTranscription);

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
