
const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const requireAuth = require('../middleware/auth');
const { generateGeminiResponse } = require('../vertexService');

// POST /api/journal/sessions - Save a completed reflection session
router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { id, type, prompts, responses, insights, emotionalState, createdAt, completedAt } = req.body;
    const userId = req.user.uid;

    if (!id || !type || !responses) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionData = {
      id,
      userId,
      type,
      prompts,
      responses,
      insights: insights || [],
      emotionalState,
      createdAt: new Date(createdAt),
      completedAt: completedAt ? new Date(completedAt) : null,
      updatedAt: new Date()
    };

    // Save to Firestore
    await db.collection('reflection_sessions').doc(id).set(sessionData);

    res.json({ success: true, sessionId: id });
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/journal/sessions - Get user's reflection sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 50;

    const sessionsRef = db.collection('reflection_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await sessionsRef.get();
    const sessions = [];

    snapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      });
    });

    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/journal/insights - Generate AI insights from reflection responses
router.post('/insights', requireAuth, async (req, res) => {
  try {
    const { type, responses, emotionalState } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Missing or invalid responses' });
    }

    // Create a comprehensive prompt for AI insights
    const prompt = `You are a compassionate AI therapist helping someone with self-reflection. They just completed a ${type} reflection session.

Their responses were:
${responses.map((response, i) => `${i + 1}. ${response}`).join('\n')}

Their emotional state before: ${emotionalState?.before || 'unknown'}/10
Emotions they identified: ${emotionalState?.emotions?.join(', ') || 'none specified'}

Please provide 3-5 insightful, compassionate observations about their reflections. Focus on:
1. Patterns or themes in their responses
2. Emotional insights or awareness
3. Potential growth opportunities
4. Positive affirmations or encouragement
5. Gentle suggestions for further reflection

Keep each insight to 1-2 sentences. Be supportive, non-judgmental, and insightful.`;

    const aiResponse = await generateGeminiResponse(prompt, {
      temperature: 0.7,
      maxTokens: 800
    });

    // Parse the AI response into individual insights
    const insights = aiResponse
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 5); // Limit to 5 insights

    res.json({ insights });
  } catch (err) {
    console.error('Error generating insights:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// POST /api/journal/reflection-prompts - Get personalized reflection prompts
router.post('/reflection-prompts', requireAuth, async (req, res) => {
  try {
    const { type, userHistory = [] } = req.body;

    // Base prompts for each reflection type
    const basePrompts = {
      daily: [
        "What was the most meaningful moment of your day and why?",
        "What challenged you today, and how did you respond?",
        "What are you grateful for from today?",
        "What did you learn about yourself today?",
        "How did you take care of yourself today?"
      ],
      emotional: [
        "What emotions are you feeling right now?",
        "Can you identify what triggered these emotions?",
        "How is your body responding to these emotions?",
        "What thoughts are accompanying these emotions?",
        "What would you like to do with these emotions?"
      ],
      mindfulness: [
        "What are you noticing about your breath right now?",
        "What sensations are present in your body?",
        "What thoughts are passing through your mind?",
        "How are you feeling in this present moment?",
        "What are you grateful for in this moment?"
      ],
      gratitude: [
        "Who or what brought joy to your day?",
        "What small thing are you thankful for?",
        "How have others supported you recently?",
        "What aspect of yourself are you grateful for?",
        "What opportunity are you thankful to have?"
      ],
      growth: [
        "What skill or quality would you like to develop?",
        "What limiting belief are you ready to release?",
        "How have you grown in the past month?",
        "What action can you take toward your goals?",
        "What does your ideal self look like?"
      ]
    };

    let prompts = basePrompts[type] || basePrompts.daily;

    // If user has history, we could personalize prompts (future enhancement)
    if (userHistory.length > 0) {
      // For now, just return base prompts
      // Future: Use AI to generate personalized prompts based on history
    }

    res.json({ prompts });
  } catch (err) {
    console.error('Error getting reflection prompts:', err);
    res.status(500).json({ error: 'Failed to get reflection prompts' });
  }
});

// DELETE /api/journal/sessions/:sessionId - Delete a reflection session
router.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    // Verify ownership
    const sessionDoc = await db.collection('reflection_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessionDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete the session
    await db.collection('reflection_sessions').doc(sessionId).delete();

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// POST /api/journal/analyze - Analyze journal entry for sentiment and reframing
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry || typeof entry !== 'string' || entry.trim().length === 0) {
      return res.status(400).json({ error: 'Entry is required and must be a non-empty string' });
    }

    // Create a comprehensive prompt for AI analysis
    const prompt = `You are a compassionate AI therapist trained in CBT and DBT. Analyze the following journal entry and provide:

1. Sentiment analysis (positive, negative, or neutral)
2. A gentle, supportive reframing of the entry using evidence-based techniques
3. Key emotional themes or patterns

Journal Entry:
${entry}

Respond with a JSON object with keys: sentiment, reframing, themes.

Guidelines:
- Sentiment should be one of: "positive", "negative", "neutral"
- Reframing should be supportive, non-judgmental, and use CBT/DBT techniques
- Themes should be an array of 2-3 key emotional patterns
- Keep reframing to 2-3 sentences
- Be empathetic and validating`;

    const aiResponse = await generateGeminiResponse(prompt, {
      temperature: 0.7,
      maxTokens: 600
    });

    // Parse the AI response
    let analysis = {};
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback parsing
        const sentimentMatch = aiResponse.match(/sentiment["\s:]+(positive|negative|neutral)/i);
        const reframingMatch = aiResponse.match(/reframing["\s:]+([^}]+)/i);

        analysis = {
          sentiment: sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral',
          reframing: reframingMatch ? reframingMatch[1].trim() : aiResponse,
          themes: ['reflection', 'emotional processing']
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = {
        sentiment: 'neutral',
        reframing: aiResponse,
        themes: ['reflection']
      };
    }

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing journal entry:', err);
    res.status(500).json({
      error: 'Failed to analyze journal entry',
      sentiment: 'neutral',
      reframing: 'AI analysis is currently unavailable. Your thoughts are valid and important.',
      themes: ['self-reflection']
    });
  }
});

// POST /api/journal/save - Save a journal entry
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { content, encrypted = true } = req.body;
    const userId = req.user.uid;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
    }

    const entryData = {
      userId,
      content: encrypted ? content : content, // In a real app, you'd encrypt here
      encrypted,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    const docRef = await db.collection('journal_entries').add(entryData);

    res.json({
      success: true,
      entryId: docRef.id,
      message: 'Journal entry saved successfully'
    });
  } catch (err) {
    console.error('Error saving journal entry:', err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

module.exports = router;
