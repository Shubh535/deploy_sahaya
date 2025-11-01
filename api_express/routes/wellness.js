// api_express/routes/wellness.js
// Routes for First Aid Kit - Smart Breathing, Affirmations, and Mindfulness Sessions

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const vertexService = require('../vertexService');
const admin = require('firebase-admin');
const db = admin.firestore();

// ============================================
// SMART BREATHING COACH ROUTES
// ============================================

// POST /wellness/narration - Generate personalized breathing narration
router.post('/narration', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { pattern, inhale, hold, exhale } = req.body;

  try {
    const prompt = `Generate a brief, calming narration (1-2 sentences) for a breathing exercise with this pattern:
- Inhale for ${inhale} seconds
- Hold for ${hold} seconds  
- Exhale for ${exhale} seconds

Pattern type: ${pattern}

The narration should be encouraging, gentle, and guide the user through the rhythm. Keep it under 30 words.`;

    const narration = await vertexService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 100
    });

    res.json({ narration: narration.trim() });
  } catch (error) {
    console.error('Narration generation error:', error);
    res.status(500).json({ error: 'Failed to generate narration' });
  }
});

// POST /wellness/breathing-session - Save breathing session completion
router.post('/breathing-session', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { pattern, cycles, duration, timestamp } = req.body;

  try {
    const sessionRef = db.collection('breathing_sessions').doc();
    await sessionRef.set({
      userId: uid,
      pattern,
      cycles,
      duration,
      completedAt: timestamp || Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user preferences
    const userPrefRef = db.collection('user_preferences').doc(uid);
    await userPrefRef.set({
      lastBreathingPattern: pattern,
      totalBreathingSessions: admin.firestore.FieldValue.increment(1),
      totalBreathingMinutes: admin.firestore.FieldValue.increment(Math.round(duration / 60))
    }, { merge: true });

    res.json({ success: true, sessionId: sessionRef.id });
  } catch (error) {
    console.error('Breathing session save error:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ============================================
// AFFIRMATION STREAM ROUTES
// ============================================

// GET /wellness/daily-affirmation - Get today's affirmation
router.get('/daily-affirmation', requireAuth, async (req, res) => {
  const { uid } = req.user;

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRef = db.collection('daily_affirmations').doc(uid);
    const doc = await dailyRef.get();

    if (doc.exists && doc.data().date === today) {
      // Return cached daily affirmation
      return res.json({ affirmation: doc.data().affirmation });
    }

    // Generate new daily affirmation
    const prompt = `Generate a single, powerful daily affirmation (1 sentence, max 20 words) that promotes:
- Self-compassion
- Inner strength
- Present-moment awareness
- Positive self-image

Make it personal, using "I" statements. Be uplifting but authentic.`;

    const text = await vertexService.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 50
    });

    const affirmation = {
      id: `daily_${Date.now()}`,
      text: text.trim().replace(/^["']|["']$/g, ''),
      category: 'daily',
      mood: 'general',
      personalized: true,
      createdAt: Date.now()
    };

    // Cache it
    await dailyRef.set({
      date: today,
      affirmation,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ affirmation });
  } catch (error) {
    console.error('Daily affirmation error:', error);
    res.status(500).json({ error: 'Failed to fetch daily affirmation' });
  }
});

// POST /wellness/affirmations - Get mood-based affirmations
router.post('/affirmations', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { mood, personalized = true, count = 5 } = req.body;

  try {
    // Fetch recent Mitra conversations for personalization
    let conversationContext = '';
    if (personalized) {
      try {
        const recentMsgs = await db.collection('chat_messages')
          .where('userId', '==', uid)
          .orderBy('timestamp', 'desc')
          .limit(3)
          .get();
        
        if (!recentMsgs.empty) {
          conversationContext = recentMsgs.docs
            .map(d => d.data().content)
            .join(' ')
            .slice(0, 500);
          console.log('Loaded Mitra context for personalization');
        }
      } catch (contextError) {
        // Firestore index might not exist yet - that's okay, just skip personalization
        console.log('Could not load Mitra context (index may not exist), continuing without personalization:', contextError.message);
      }
    }

    const moodPrompts = {
      anxiety: 'calm, grounded, safe, present, in control',
      sadness: 'resilient, hopeful, worthy of love, capable of joy',
      motivation: 'capable, driven, unstoppable, progressing, achieving',
      confidence: 'strong, capable, valued, respected, powerful',
      gratitude: 'blessed, appreciative, abundant, fortunate, fulfilled',
      'self-love': 'worthy, beautiful, enough, deserving, valuable'
    };

    const moodTheme = moodPrompts[mood] || 'peaceful, balanced, strong';

    // Add variety to prompt to prevent repeated responses
    const approaches = [
      'action-oriented and empowering',
      'gentle and compassionate', 
      'strong and confident',
      'peaceful and calming',
      'hopeful and forward-looking'
    ];
    const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
    const timestamp = Date.now();

    const prompt = `Generate ${count} UNIQUE and FRESH affirmations for someone experiencing ${mood}. Make them ${randomApproach}.

${conversationContext ? `Context from their recent reflections: "${conversationContext.slice(0, 200)}..."` : ''}

Each affirmation should:
- Be 10-15 words long
- Use "I" statements (first person)
- Feel ${moodTheme}
- Be genuine, specific, and empowering
- Be completely different from common generic affirmations
- Avoid clichés - be creative and original

IMPORTANT: Generate NEW variations each time, not the same phrases.

Return ONLY a JSON array of ${count} strings, no additional text.
Example format: ["I am...", "I choose...", "I embrace..."]

Request ID: ${timestamp}`;

    const response = await vertexService.generateText(prompt, {
      temperature: 0.95, // Increased for more variety
      maxTokens: 500,
      responseMimeType: 'application/json'
    });

    console.log('Gemini response for affirmations:', response);

    let affirmationTexts = [];
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(response);
      affirmationTexts = Array.isArray(parsed) ? parsed : parsed.affirmations || [];
      console.log('Parsed affirmations from JSON:', affirmationTexts);
    } catch (parseError) {
      console.log('JSON parse failed, trying fallback parsing:', parseError.message);
      // Fallback parsing for non-JSON responses
      affirmationTexts = response.split('\n')
        .filter(line => line.trim().startsWith('"') || line.trim().startsWith('I '))
        .map(line => line.trim().replace(/^["'\-\d.]+\s*/, '').replace(/["',]+$/, ''))
        .filter(text => text.length > 10) // Only keep meaningful affirmations
        .slice(0, count);
      console.log('Fallback parsed affirmations:', affirmationTexts);
    }

    // If still no affirmations, generate fallback ones
    if (!affirmationTexts || affirmationTexts.length === 0) {
      console.log('No affirmations generated, using backend fallback');
      const fallbackAffirmations = {
        anxiety: [
          'I am safe in this moment and I trust myself completely.',
          'My breath anchors me to the calm present.',
          'I release what I cannot control with grace.',
          'Peace flows through me with every breath.',
          'I am stronger than my anxious thoughts.'
        ],
        sadness: [
          'I honor my feelings and allow myself to heal.',
          'This moment will pass and joy will return.',
          'I am worthy of love even in my sadness.',
          'My heart is healing with each passing day.',
          'I embrace this time with self-compassion.'
        ],
        motivation: [
          'I am capable of achieving anything I set my mind to.',
          'Every step forward is progress worth celebrating.',
          'My potential is limitless and I am unstoppable.',
          'I choose action and make today count.',
          'Success is built one determined moment at a time.'
        ],
        confidence: [
          'I trust my abilities and know my worth.',
          'I am powerful capable and deserving of respect.',
          'My voice matters and I speak with confidence.',
          'I embrace my unique strengths and celebrate myself.',
          'I am enough exactly as I am right now.'
        ],
        gratitude: [
          'I am grateful for the gift of this present moment.',
          'Abundance flows to me from expected and unexpected sources.',
          'I appreciate the beauty and blessings in my life.',
          'My heart overflows with thankfulness for what I have.',
          'I recognize and celebrate the good surrounding me.'
        ],
        'self-love': [
          'I am deserving of my own love and kindness.',
          'I treat myself with the compassion I give others.',
          'My worth is inherent and not based on achievement.',
          'I honor my needs and set boundaries with love.',
          'I am beautiful inside and out exactly as I am.'
        ]
      };
      affirmationTexts = fallbackAffirmations[mood] || fallbackAffirmations.motivation;
    }

    const affirmations = affirmationTexts.map((text, i) => ({
      id: `${mood}_${Date.now()}_${i}`,
      text,
      category: mood,
      mood,
      personalized: conversationContext.length > 0 && affirmationTexts.length > 0, // Only true if we had Mitra context
      createdAt: Date.now()
    }));

    console.log(`✅ Returning ${affirmations.length} affirmations for mood: ${mood}`);
    console.log(`📊 Personalization Status: ${conversationContext.length > 0 ? 'YES - Used Mitra conversation context' : 'NO - Generic (chat with Mitra for personalization)'}`);
    console.log(`🎯 Affirmation Source: Gemini AI`);
    
    res.json({ affirmations });
  } catch (error) {
    console.error('Affirmations generation error:', error);
    res.status(500).json({ error: 'Failed to generate affirmations' });
  }
});

// POST /wellness/save-affirmation - Save favorite affirmation
router.post('/save-affirmation', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { affirmationId, text, mood } = req.body;

  try {
    const savedRef = db.collection('saved_affirmations').doc(uid).collection('affirmations').doc(affirmationId);
    await savedRef.set({
      text,
      mood,
      savedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log interaction
    await db.collection('affirmation_interactions').add({
      userId: uid,
      affirmationId,
      action: 'saved',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Save affirmation error:', error);
    res.status(500).json({ error: 'Failed to save affirmation' });
  }
});

// GET /wellness/saved-affirmations - Get saved affirmations
router.get('/saved-affirmations', requireAuth, async (req, res) => {
  const { uid } = req.user;

  try {
    const snapshot = await db.collection('saved_affirmations').doc(uid).collection('affirmations').get();
    const saved = snapshot.docs.map(d => d.id);
    res.json({ saved });
  } catch (error) {
    console.error('Fetch saved affirmations error:', error);
    res.status(500).json({ error: 'Failed to fetch saved affirmations' });
  }
});

// POST /wellness/set-reminder - Set affirmation reminder
router.post('/set-reminder', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { affirmationId, text, remindAt } = req.body;

  try {
    await db.collection('affirmation_reminders').add({
      userId: uid,
      affirmationId,
      text,
      remindAt,
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, remindAt });
  } catch (error) {
    console.error('Set reminder error:', error);
    res.status(500).json({ error: 'Failed to set reminder' });
  }
});

// POST /wellness/text-to-speech - Convert text to speech
router.post('/text-to-speech', requireAuth, async (req, res) => {
  const { text, voice = 'calm' } = req.body;

  try {
    // Note: Google Cloud Text-to-Speech requires additional setup
    // For now, return a placeholder or use browser's built-in speech synthesis
    res.json({
      success: true,
      message: 'Use browser Speech Synthesis API',
      audioUrl: null // Would contain actual TTS audio URL with proper setup
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS not yet implemented' });
  }
});

// ============================================
// MINDFULNESS MICRO-SESSIONS ROUTES
// ============================================

// POST /wellness/generate-session - Generate session script
router.post('/generate-session', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { sessionType, duration } = req.body;

  try {
    const sessionPrompts = {
      'calm-2min': 'Generate a 2-minute calming session with 4 phases: breathe (30s), reflect on peace (30s), affirm calmness (30s), close (30s)',
      'focus-reset': 'Generate a 3-minute focus session: breathe deeply (45s), reflect on clarity (45s), affirm concentration (45s), close (45s)',
      'gratitude-pulse': 'Generate a 4-minute gratitude session: breathe (60s), reflect on blessings (60s), affirm appreciation (60s), close (60s)',
      'letting-go': 'Generate a 5-minute release session: breathe (75s), reflect on tension (75s), affirm release (75s), close (75s)'
    };

    const prompt = `${sessionPrompts[sessionType] || sessionPrompts['calm-2min']}

For each phase, provide:
1. Phase name (breathe/reflect/affirm/close)
2. Title (2-3 words)
3. Instruction (one calming, directive sentence)
4. Duration in seconds

Return as JSON array:
[
  {
    "phase": "breathe",
    "title": "Deep Breathing",
    "instruction": "Take slow, deep breaths, inhaling peace and exhaling tension.",
    "duration": 30
  },
  ...
]`;

    const response = await vertexService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 800,
      responseMimeType: 'application/json'
    });

    let steps = [];
    try {
      steps = JSON.parse(response);
    } catch {
      // Fallback steps
      steps = [
        { phase: 'breathe', title: 'Breathe Deeply', instruction: 'Take slow, deep breaths', duration: 30 },
        { phase: 'reflect', title: 'Notice Yourself', instruction: 'Observe how you feel without judgment', duration: 30 },
        { phase: 'affirm', title: 'Affirm Peace', instruction: 'I am calm and centered', duration: 30 },
        { phase: 'close', title: 'Return Gently', instruction: 'Gently bring your awareness back to the present', duration: 30 }
      ];
    }

    res.json({ steps });
  } catch (error) {
    console.error('Session generation error:', error);
    res.status(500).json({ error: 'Failed to generate session' });
  }
});

// POST /wellness/complete-session - Save session completion with XP
router.post('/complete-session', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { sessionType, duration, xpEarned, completedAt } = req.body;

  try {
    // Save session completion
    await db.collection('completed_sessions').add({
      userId: uid,
      sessionType,
      duration,
      xpEarned,
      completedAt: completedAt || Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update wellness progress
    const progressRef = db.collection('wellness_progress').doc(uid);
    const progressDoc = await progressRef.get();
    
    const currentXP = progressDoc.exists ? (progressDoc.data().xp || 0) : 0;
    const newTotalXP = currentXP + xpEarned;
    const newLevel = Math.floor(newTotalXP / 100) + 1;

    await progressRef.set({
      xp: newTotalXP,
      level: newLevel,
      totalSessions: admin.firestore.FieldValue.increment(1),
      lastSessionAt: completedAt || Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({
      success: true,
      totalXP: newTotalXP,
      level: newLevel,
      xpEarned
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to save session completion' });
  }
});

// GET /wellness/progress - Get wellness progress
router.get('/progress', requireAuth, async (req, res) => {
  const { uid } = req.user;

  try {
    const progressDoc = await db.collection('wellness_progress').doc(uid).get();
    
    if (!progressDoc.exists) {
      return res.json({
        level: 1,
        xp: 0,
        totalSessions: 0
      });
    }

    res.json(progressDoc.data());
  } catch (error) {
    console.error('Fetch progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

module.exports = router;
