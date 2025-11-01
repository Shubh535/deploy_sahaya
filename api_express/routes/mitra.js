const express = require('express');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');
const { chatWithGemini } = require('../gcloud');
const { runConversationTurn } = require('../services/conversation');
const { LANGUAGE_REGISTRY } = require('../services/conversation/promptConfig');
const { transcribeAudio } = require('../services/stt');
const { synthesizeSpeech } = require('../services/tts');

const router = express.Router();

// Supported language listing for client configuration
router.get('/languages', authMiddleware, (req, res) => {
  const languages = Object.entries(LANGUAGE_REGISTRY).map(([key, config]) => ({
    key,
    label: config.label,
    locale: config.locale,
    translatorDirective: config.translatorDirective
  }));

  languages.sort((a, b) => a.label.localeCompare(b.label, 'en'));

  res.json({ languages });
});

// Test route without auth for API testing
router.post('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test successful' });
});

// Main chat route with authentication
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { message, mode = 'listener', language = 'en', history = [], emotionalIntensity = 0, includeJournalContext = false } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    // Fetch journal context if requested
    let journalContext = '';
    if (includeJournalContext) {
      try {
        // Get Firebase ID token from request headers
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (token) {
          const fetch = require('node-fetch');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const contextRes = await fetch(`${frontendUrl}/api/manthan/journal-context?limit=5&days=14`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (contextRes.ok) {
            const contextData = await contextRes.json();
            journalContext = `\n\n[CONTEXT: ${contextData.contextText}\n${contextData.moodPattern}]\n\n`;
          }
        }
      } catch (error) {
        console.error('Failed to fetch journal context:', error);
        // Continue without journal context if it fails
      }
    }

    // Enhance the message with emotional context if intensity is detected
    let enhancedMessage = message;
    if (emotionalIntensity > 5) {
      enhancedMessage = `[User is experiencing high emotional intensity (${emotionalIntensity}/10). Respond with extra compassion and care.] ${message}`;
    } else if (emotionalIntensity > 2) {
      enhancedMessage = `[User is experiencing moderate emotional intensity (${emotionalIntensity}/10). Be attentive to their needs.] ${message}`;
    }

    // Add journal context if available
    if (journalContext) {
      enhancedMessage = journalContext + enhancedMessage;
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

router.post('/transcribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { audioBase64, mimeType = 'audio/webm', language = 'en-US', enableSpeakerDiarization = false } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 payload is required.' });
    }

    const cleanedBase64 = audioBase64.includes(',') ? audioBase64.split(',').pop() : audioBase64;

    const transcription = await transcribeAudio({
      audioBase64: cleanedBase64,
      mimeType,
      languageCode: language,
      enableSpeakerDiarization,
    });

    res.json({
      transcript: transcription.transcript,
      confidence: transcription.confidence,
      languageCode: transcription.languageCode,
      words: transcription.words,
      meta: {
        userId,
        mimeType,
        enableSpeakerDiarization,
        wordCount: transcription.words?.length || 0,
      },
    });
  } catch (error) {
    console.error('POST /api/mitra/transcribe error:', error);
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

router.post('/speak', authMiddleware, async (req, res) => {
  try {
    const { text, language = 'en', speakingRate, pitch } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const synthesis = await synthesizeSpeech({
      text,
      language,
      speakingRate: typeof speakingRate === 'number' ? speakingRate : undefined,
      pitch: typeof pitch === 'number' ? pitch : undefined
    });

    res.json({
      audioBase64: Buffer.from(synthesis.audioContent).toString('base64'),
      mimeType: synthesis.mimeType,
      voice: synthesis.voice
    });
  } catch (error) {
    console.error('POST /api/mitra/speak error:', error);
    res.status(500).json({ error: 'Speech synthesis failed', details: error.message });
  }
});

// Next-gen conversational endpoint (Gemini + Gemma + Memory scaffolding)
router.post('/conversation', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      message,
      mode = 'listener',
      language = 'en',
      history = [],
      metadata = {},
      includeJournalContext = false
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Fetch journal context if requested
    let journalContext = '';
    if (includeJournalContext) {
      try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (token) {
          const fetch = require('node-fetch');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const contextRes = await fetch(`${frontendUrl}/api/manthan/journal-context?limit=5&days=14`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (contextRes.ok) {
            const contextData = await contextRes.json();
            journalContext = `\n\n[JOURNAL CONTEXT: ${contextData.contextText}\n${contextData.moodPattern}]\n\n`;
          }
        }
      } catch (error) {
        console.error('Failed to fetch journal context:', error);
        // Continue without journal context if it fails
      }
    }

    // Add journal context to message if available
    const enhancedMessage = journalContext ? journalContext + message.trim() : message.trim();

    const conversationResult = await runConversationTurn({
      userId,
      message: enhancedMessage,
      mode,
      language,
      history,
      metadata
    });

    res.json(conversationResult);
  } catch (error) {
    console.error('POST /api/mitra/conversation error:', error);
    res.status(500).json({ error: 'Conversation processing failed', details: error.message });
  }
});

module.exports = router;
