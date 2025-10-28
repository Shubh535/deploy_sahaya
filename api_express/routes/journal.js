const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const requireAuth = require('../middleware/auth');
const { generateGeminiResponse } = require('../vertexService');

const POSITIVE_KEYWORDS = ['great', 'good', 'awesome', 'nice', 'best', 'grateful', 'gratitude', 'joy', 'happy', 'excited', 'hopeful', 'calm', 'peaceful', 'relaxed', 'love'];
const NEGATIVE_KEYWORDS = ['bad', 'sad', 'angry', 'upset', 'worried', 'anxious', 'stressed', 'stressful', 'tired', 'lonely', 'frustrated', 'afraid', 'scared', 'overwhelmed', 'tough', 'hard', 'difficult'];

function simpleSentiment(entry = '') {
  const text = entry.toLowerCase();
  let score = 0;
  POSITIVE_KEYWORDS.forEach(word => {
    if (text.includes(word)) score += 1;
  });
  NEGATIVE_KEYWORDS.forEach(word => {
    if (text.includes(word)) score -= 1;
  });
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function fallbackThemes(sentiment) {
  if (sentiment === 'positive') return ['gratitude', 'positivity'];
  if (sentiment === 'negative') return ['self-compassion', 'resilience'];
  return ['reflection', 'balance'];
}

function fallbackSuggestion(sentiment) {
  if (sentiment === 'positive') {
    return 'Celebrate what went well today and jot down one way to repeat it tomorrow.';
  }
  if (sentiment === 'negative') {
    return 'Take a grounding breath and choose one small supportive action for yourself in the next hour.';
  }
  return 'Pause to notice one thing you appreciated and one thing you can gently adjust tomorrow.';
}

function fallbackReframing(entry, sentiment) {
  const snippet = entry?.trim() ? entry.trim().slice(0, 180) : '';
  if (sentiment === 'positive') {
    return `It's wonderful to notice a bright moment like "${snippet || 'this experience'}". Hold onto what made it feel good and consider how you can invite more of it into tomorrow.`;
  }
  if (sentiment === 'negative') {
    return `That sounds heavy, and it's understandable to feel that way. Try acknowledging what you're carrying and ask what evidence supports the tougher thoughts—you deserve the same kindness you'd offer a friend.`;
  }
  return `You're observing your experience with curiosity. Try naming one feeling at a time and explore what support you might need to keep that balance.`;
}

function buildFallbackAnalysis(entry) {
  const sentiment = simpleSentiment(entry);
  return {
    sentiment,
    reframing: fallbackReframing(entry, sentiment),
    themes: fallbackThemes(sentiment),
    suggestion: fallbackSuggestion(sentiment)
  };
}

function cleanModelText(text = '') {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    clean = clean.replace(/```$/i, '').trim();
  }
  return clean;
}

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

    // Check if the response contains an error
    if (aiResponse.error) {
      console.error('AI response error:', aiResponse.message);
      return res.status(500).json({ error: 'AI analysis failed', details: aiResponse.message });
    }

    // Parse the AI response into individual insights
    let insights = [];

    if (typeof aiResponse === 'string') {
      let cleanText = aiResponse.trim();

      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) {
          insights = parsed
            .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
            .filter(line => line.length > 10)
            .slice(0, 5);
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini insights as JSON:', parseError);
      }

      if (!insights.length) {
        insights = cleanText
          .split(/\n|•|\u2022|\r/)
          .map(line => line.replace(/^[-*]\s*/, ''))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .map(line => line.replace(/^"|"$/g, '').replace(/,$/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 5);
      }
    }

    if (!insights.length) {
      console.warn('Gemini returned empty insights, using fallback copy.');
      insights = [
        'Take a moment to acknowledge your reflections and the effort you put into understanding yourself.',
        'Consider one gentle action that supports how you want to feel tomorrow.',
        'Notice any patterns in your responses and celebrate the progress you are making, however small.',
      ];
    }

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

    const fallbackAnalysis = buildFallbackAnalysis(entry);
    const fallbackPayload = JSON.stringify(fallbackAnalysis);

    // Create a comprehensive prompt for AI analysis
    const prompt = `You are a compassionate AI therapist trained in CBT (Cognitive Behavioral Therapy) and DBT (Dialectical Behavior Therapy). Analyze the following journal entry and provide:

1. Sentiment analysis (positive, negative, or neutral)
2. A gentle, supportive reframing of the entry using evidence-based CBT techniques like cognitive restructuring, behavioral activation, or mindfulness
3. Key emotional themes or patterns
4. One actionable CBT-based suggestion for the next 24 hours

Journal Entry:
${entry}

Respond with a JSON object with keys: sentiment, reframing, themes, suggestion.

Guidelines:
- Sentiment should be one of: "positive", "negative", "neutral"
- Reframing should be supportive, non-judgmental, and use CBT/DBT techniques (e.g., "What evidence supports this thought?", "How might this look from another perspective?", "What would you tell a friend in this situation?")
- Themes should be an array of 2-3 key emotional patterns (e.g., "anxiety", "self-doubt", "gratitude")
- Suggestion should be one practical, CBT-inspired action (e.g., "Try a 5-minute mindfulness exercise", "Challenge one negative thought with evidence")
- Keep reframing to 2-3 sentences
- Be empathetic, validating, and solution-focused`;

    const aiResponse = await generateGeminiResponse(prompt, {
      temperature: 0.6,
      maxTokens: 512,
      responseMimeType: 'application/json',
      fallbackText: fallbackPayload
    });

    // Check if the response contains an error
    if (aiResponse.error) {
      console.error('AI response error:', aiResponse.message);
      return res.json(fallbackAnalysis);
    }

    // Parse the AI response
    let analysis = { ...fallbackAnalysis };
    try {
      if (typeof aiResponse === 'string') {
        const clean = cleanModelText(aiResponse);
        let parsed = null;

        try {
          parsed = JSON.parse(clean);
        } catch {
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          analysis = { ...analysis, ...parsed };
        } else {
          const sentimentMatch = clean.match(/"?sentiment"?["\s:=]+(positive|negative|neutral)/i);
          const reframingMatch = clean.match(/"?reframing"?["\s:=]+([^"}]+|"[^"]+")/i);
          const suggestionMatch = clean.match(/"?suggestion"?["\s:=]+([^"}]+|"[^"]+")/i);

          analysis = {
            ...analysis,
            sentiment: sentimentMatch ? sentimentMatch[1].toLowerCase() : analysis.sentiment,
            reframing: reframingMatch ? reframingMatch[1].replace(/^"|"$/g, '').trim() : analysis.reframing,
            suggestion: suggestionMatch ? suggestionMatch[1].replace(/^"|"$/g, '').trim() : analysis.suggestion
          };
        }
      } else if (aiResponse && typeof aiResponse === 'object') {
        analysis = { ...analysis, ...aiResponse };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = { ...fallbackAnalysis };
    }

    const allowedSentiments = new Set(['positive', 'negative', 'neutral']);
    if (typeof analysis.sentiment === 'string') {
      analysis.sentiment = analysis.sentiment.toLowerCase().trim();
    }
    if (!allowedSentiments.has(analysis.sentiment)) {
      analysis.sentiment = fallbackAnalysis.sentiment;
    }

    if (typeof analysis.reframing !== 'string' || !analysis.reframing.trim()) {
      analysis.reframing = fallbackAnalysis.reframing;
    } else {
      analysis.reframing = analysis.reframing.trim();
    }

    if (!Array.isArray(analysis.themes) || !analysis.themes.length) {
      analysis.themes = fallbackAnalysis.themes;
    } else {
      analysis.themes = analysis.themes
        .map(theme => (typeof theme === 'string' ? theme.trim() : String(theme)))
        .filter(Boolean)
        .slice(0, 3);
      if (!analysis.themes.length) {
        analysis.themes = fallbackAnalysis.themes;
      }
    }

    if (typeof analysis.suggestion !== 'string' || !analysis.suggestion.trim()) {
      analysis.suggestion = fallbackAnalysis.suggestion;
    } else {
      analysis.suggestion = analysis.suggestion.trim();
    }

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing journal entry:', err);
    res.status(500).json({
      error: 'Failed to analyze journal entry',
      sentiment: 'neutral',
      reframing: 'AI analysis is currently unavailable. Your thoughts are valid and important.',
      themes: ['self-reflection'],
      suggestion: 'Take a deep breath and acknowledge your feelings.'
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

// POST /api/journal/mood - Save a mood entry
router.post('/mood', requireAuth, async (req, res) => {
  try {
    const { mood, note, emotions, triggers } = req.body;
    const userId = req.user.uid;

    if (!mood || typeof mood !== 'number' || mood < 1 || mood > 10) {
      return res.status(400).json({ error: 'Mood must be a number between 1 and 10' });
    }

    const moodData = {
      userId,
      mood,
      note: note || '',
      emotions: emotions || [],
      triggers: triggers || [],
      createdAt: new Date()
    };

    // Save to Firestore
    const docRef = await db.collection('mood_entries').add(moodData);

    res.json({
      success: true,
      entryId: docRef.id,
      message: 'Mood entry saved successfully'
    });
  } catch (err) {
    console.error('Error saving mood entry:', err);
    res.status(500).json({ error: 'Failed to save mood entry' });
  }
});

// GET /api/journal/mood - Get user's mood history
router.get('/mood', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 30;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;

    let query = db.collection('mood_entries')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }

    const snapshot = await query.get();
    const moodEntries = [];

    snapshot.forEach(doc => {
      moodEntries.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      });
    });

    res.json({ moodEntries });
  } catch (err) {
    console.error('Error fetching mood entries:', err);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// POST /api/journal/export - Export journal sessions to a book format
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { format = 'markdown', startDate, endDate } = req.body;
    const userId = req.user.uid;

    let query = db.collection('reflection_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'asc');

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const sessions = [];

    snapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
      });
    });

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'No sessions found for export' });
    }

    // Generate book content
    let bookContent = `# My Self-Introspection Journey\n\n`;
    bookContent += `Exported on ${new Date().toLocaleDateString()}\n\n`;
    bookContent += `Total sessions: ${sessions.length}\n\n`;

    // Group by type
    const sessionsByType = sessions.reduce((acc, session) => {
      if (!acc[session.type]) acc[session.type] = [];
      acc[session.type].push(session);
      return acc;
    }, {});

    Object.keys(sessionsByType).forEach(type => {
      bookContent += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Reflections\n\n`;
      sessionsByType[type].forEach(session => {
        bookContent += `### ${new Date(session.createdAt).toLocaleDateString()}\n\n`;
        session.prompts.forEach((prompt, i) => {
          bookContent += `**${prompt}**\n\n${session.responses[i] || 'No response'}\n\n`;
        });
        if (session.insights && session.insights.length > 0) {
          bookContent += `**AI Insights:**\n\n`;
          session.insights.forEach(insight => {
            bookContent += `- ${insight}\n`;
          });
          bookContent += `\n`;
        }
        bookContent += `---\n\n`;
      });
    });

    // Add summary insights
    bookContent += `## Journey Summary\n\n`;
    const totalSessions = sessions.length;
    const avgEmotionalState = sessions.reduce((sum, s) => sum + (s.emotionalState?.before || 5), 0) / totalSessions;
    bookContent += `Over ${totalSessions} reflection sessions, your average emotional state was ${avgEmotionalState.toFixed(1)}/10.\n\n`;

    // Use AI to generate a summary
    const summaryPrompt = `Based on ${totalSessions} reflection sessions, create a compassionate summary of this person's self-introspection journey. Focus on growth, patterns, and encouragement. Keep it to 3-4 paragraphs.`;
    const aiSummary = await generateGeminiResponse(summaryPrompt, { temperature: 0.8, maxTokens: 500 });

    // Check if the response contains an error
    if (aiSummary.error) {
      console.error('AI summary error:', aiSummary.message);
      bookContent += 'AI summary generation failed. Please try again later.';
    } else {
      bookContent += aiSummary;
    }

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="my-journey.md"');
      res.send(bookContent);
    } else {
      res.json({ bookContent });
    }
  } catch (err) {
    console.error('Error exporting journal:', err);
    res.status(500).json({ error: 'Failed to export journal' });
  }
});

module.exports = router;
