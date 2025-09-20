const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { chatWithGemini } = require('../gcloud');

// POST /chat/message - AI chatbot using free Gemini API (protected)
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message, mode = 'listener', language = 'en', history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const result = await chatWithGemini({ 
      message, 
      mode, 
      language, 
      history, 
      userId: req.user.uid 
    });
    
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
