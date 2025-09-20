const express = require('express');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');
const { chatWithGemini } = require('../gcloud');

const router = express.Router();

// Test route without auth for API testing
router.post('/test', async (req, res) => {
  try {
    const { message, emotionalIntensity = 0 } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    // Enhance the message with emotional context if intensity is detected
    let enhancedMessage = message;
    if (emotionalIntensity > 5) {
      enhancedMessage = `[User is experiencing high emotional intensity (${emotionalIntensity}/10). Respond with extra compassion and care.] ${message}`;
    } else if (emotionalIntensity > 2) {
      enhancedMessage = `[User is experiencing moderate emotional intensity (${emotionalIntensity}/10). Be attentive to their needs.] ${message}`;
    }

    const aiResponse = await chatWithGemini({
      message: enhancedMessage,
      mode: 'listener',
      language: 'en',
      history: [],
      userId: 'test-user',
    });

    res.json({ aiResponse, status: 'success', emotionalIntensity });
  } catch (error) {
    console.error('POST /api/mitra/test error:', error);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

// Main chat route with authentication
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { message, mode = 'listener', language = 'en', history = [], emotionalIntensity = 0 } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    // Enhance the message with emotional context if intensity is detected
    let enhancedMessage = message;
    if (emotionalIntensity > 5) {
      enhancedMessage = `[User is experiencing high emotional intensity (${emotionalIntensity}/10). Respond with extra compassion and care.] ${message}`;
    } else if (emotionalIntensity > 2) {
      enhancedMessage = `[User is experiencing moderate emotional intensity (${emotionalIntensity}/10). Be attentive to their needs.] ${message}`;
    }

    const aiResponse = await chatWithGemini({
      message: enhancedMessage,
      mode,
      language,
      history,
      userId,
    });

    res.json({ aiResponse, emotionalIntensity });
  } catch (error) {
    console.error('POST /api/mitra/chat error:', error);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

module.exports = router;
