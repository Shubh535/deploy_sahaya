const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');
const { db } = require('../firebase');
const { generateGeminiResponse } = require('../vertexService');

// Collect comprehensive user data from all sources
async function collectUserData(userId) {
  const data = {
    journals: [],
    health: [],
    mood: [],
    manthan: [],
    recentActivity: []
  };

  try {
    console.log('Starting data collection for userId:', userId);

    // Get recent journal entries
    console.log('Querying journals...');
    const journalsSnapshot = await db.collection('journals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    console.log('Journals query completed, docs found:', journalsSnapshot.size);
    journalsSnapshot.forEach(doc => {
      const entry = doc.data();
      data.journals.push({
        content: entry.content || entry.encrypted,
        createdAt: entry.createdAt,
        mood: entry.mood,
        tags: entry.tags || []
      });
    });

    // Get health data
    console.log('Querying health data...');
    const healthSnapshot = await db.collection('health_data')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log('Health query completed, docs found:', healthSnapshot.size);
    healthSnapshot.forEach(doc => {
      data.health.push(doc.data());
    });

    // Get mood tracking data
    console.log('Querying mood data...');
    const moodSnapshot = await db.collection('mood_tracking')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    console.log('Mood query completed, docs found:', moodSnapshot.size);
    moodSnapshot.forEach(doc => {
      data.mood.push(doc.data());
    });

    // Get Manthan/reflection session data
    console.log('Querying manthan data...');
    const manthanSnapshot = await db.collection('reflection_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log('Manthan query completed, docs found:', manthanSnapshot.size);
    manthanSnapshot.forEach(doc => {
      data.manthan.push(doc.data());
    });

    // Get recent activity (tree planting, etc.)
    console.log('Querying activity data...');
    const activitySnapshot = await db.collection('user_activity')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    console.log('Activity query completed, docs found:', activitySnapshot.size);
    activitySnapshot.forEach(doc => {
      data.recentActivity.push(doc.data());
    });

    console.log('Data collection completed:', {
      journals: data.journals.length,
      health: data.health.length,
      mood: data.mood.length,
      manthan: data.manthan.length,
      activity: data.recentActivity.length
    });

  } catch (error) {
    console.error('Error collecting user data:', error);
    console.error('Error details:', error.message);
  }

  return data;
}

// Perform advanced AI analysis using comprehensive data
async function performAdvancedAnalysis(userData) {
  try {
    // Prepare comprehensive context for AI analysis
    const context = buildAnalysisContext(userData);

    const prompt = `You are an expert in sound therapy and emotional wellness. Analyze the following comprehensive user data and provide detailed insights for personalized sound therapy recommendations.

${context}

Based on this data, provide a JSON response with:
{
  "moodState": "current emotional state (anxious, stressed, calm, focused, tired, energetic, etc.)",
  "confidence": "confidence level 0-1",
  "keyThemes": ["array of main emotional themes"],
  "soundNeeds": ["array of specific sound therapy needs"],
  "timeOfDay": "best time for sound therapy based on patterns",
  "intensity": "recommended intensity level (low, medium, high)",
  "duration": "recommended session duration in minutes",
  "summary": "brief summary of analysis"
}`;

    const analysisText = await generateGeminiResponse(prompt, { temperature: 0.3, maxTokens: 600 });

    // Parse the AI response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // Fallback parsing if JSON is malformed
      analysis = {
        moodState: extractMoodState(analysisText),
        confidence: 0.7,
        keyThemes: extractThemes(analysisText),
        soundNeeds: ['relaxation', 'focus'],
        timeOfDay: 'anytime',
        intensity: 'medium',
        duration: 30,
        summary: analysisText.substring(0, 200)
      };
    }

    return analysis;

  } catch (error) {
    console.error('Advanced analysis error:', error);
    return {
      moodState: 'neutral',
      confidence: 0.5,
      keyThemes: ['general_wellness'],
      soundNeeds: ['relaxation'],
      timeOfDay: 'anytime',
      intensity: 'medium',
      duration: 20,
      summary: 'Analysis temporarily unavailable. Using general recommendations.'
    };
  }
}

// Build comprehensive context for AI analysis
function buildAnalysisContext(userData) {
  let context = 'USER DATA ANALYSIS:\n\n';

  // Journal entries
  if (userData.journals.length > 0) {
    context += 'RECENT JOURNAL ENTRIES:\n';
    userData.journals.slice(0, 5).forEach((entry, i) => {
      context += `${i + 1}. ${entry.content?.substring(0, 200)}...\n`;
      if (entry.mood) context += `   Mood: ${entry.mood}\n`;
      context += `   Date: ${new Date(entry.createdAt?.toDate?.() || entry.createdAt).toLocaleDateString()}\n\n`;
    });
  }

  // Mood tracking
  if (userData.mood.length > 0) {
    context += 'MOOD TRACKING DATA:\n';
    const recentMoods = userData.mood.slice(0, 10);
    const moodCounts = {};
    recentMoods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    context += `Most common moods: ${Object.entries(moodCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(([mood, count]) => `${mood}(${count})`).join(', ')}\n\n`;
  }

  // Manthan/reflection data
  if (userData.manthan.length > 0) {
    context += 'MANTHAN REFLECTION SESSIONS:\n';
    userData.manthan.slice(0, 3).forEach((session, i) => {
      context += `${i + 1}. Type: ${session.type}\n`;
      if (session.emotionalState) context += `   Emotional State: ${session.emotionalState}\n`;
      if (session.responses) context += `   Key Response: ${session.responses[0]?.substring(0, 100)}...\n`;
      context += '\n';
    });
  }

  // Recent activity patterns
  if (userData.recentActivity.length > 0) {
    context += 'RECENT ACTIVITY PATTERNS:\n';
    const activities = userData.recentActivity.slice(0, 10);
    const activityTypes = {};
    activities.forEach(a => {
      activityTypes[a.type] = (activityTypes[a.type] || 0) + 1;
    });
    context += `Activity patterns: ${Object.entries(activityTypes).map(([type, count]) => `${type}(${count})`).join(', ')}\n\n`;
  }

  return context;
}

// Generate personalized sound recommendations based on analysis
function generatePersonalizedRecommendations(analysis, userData) {
  const recommendations = [];
  const { moodState, soundNeeds, intensity, keyThemes } = analysis;

  // Enhanced sound library with more options and benefits
  const soundLibrary = {
    anxiety: [
      { name: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Reduces cortisol, promotes deep relaxation, masks racing thoughts' },
      { name: 'Gentle Rain', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural white noise that calms the nervous system' },
      { name: 'Binaural Beats Theta', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: '4-8Hz theta waves for deep relaxation and meditation' }
    ],
    stress: [
      { name: 'Forest Ambience', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Nature sounds reduce stress hormones and improve mood' },
      { name: 'Tibetan Singing Bowls', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Ancient healing frequencies for stress relief' },
      { name: 'Soft Piano', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Melodic tones that soothe the mind and reduce tension' }
    ],
    focus: [
      { name: 'Brown Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Deep, rich sound that enhances concentration and blocks distractions' },
      { name: 'Alpha Waves', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: '8-12Hz alpha waves for relaxed focus and creativity' },
      { name: 'Coffee Shop Ambience', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Balanced background noise that improves productivity' }
    ],
    sleep: [
      { name: 'Deep Ocean', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Promotes delta wave sleep and deep rest' },
      { name: 'Night Rain', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Soothing precipitation sounds for better sleep quality' },
      { name: 'Whale Songs', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Low-frequency tones that induce relaxation and sleep' }
    ],
    energy: [
      { name: 'Upbeat Forest', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural sounds with gentle stimulation for energy boost' },
      { name: 'Beta Waves', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: '13-30Hz beta waves for alertness and motivation' },
      { name: 'Morning Birds', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural wake-up sounds that boost morning energy' }
    ],
    depression: [
      { name: 'Healing Water', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Flowing water sounds that lift mood and reduce sadness' },
      { name: 'Sunrise Ambience', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Warm, uplifting nature sounds for emotional healing' },
      { name: '528Hz Love Frequency', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Solfeggio frequency associated with love and emotional healing' }
    ],
    creativity: [
      { name: 'Pink Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Balanced noise that enhances creative thinking' },
      { name: 'Wind Chimes', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Melodic, random sounds that spark inspiration' },
      { name: 'Jazz Cafe', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Creative atmosphere sounds for artistic flow' }
    ]
  };

  // Generate recommendations based on mood state and needs
  if (moodState === 'anxious' || moodState === 'anxiety') {
    recommendations.push({
      category: 'anxiety-relief',
      sounds: soundLibrary.anxiety,
      reason: `Based on your current ${moodState} state, these sounds are scientifically proven to reduce anxiety symptoms and promote calmness.`,
      priority: 'high'
    });
  }

  if (moodState === 'stressed' || moodState === 'stress' || keyThemes.includes('stress')) {
    recommendations.push({
      category: 'stress-relief',
      sounds: soundLibrary.stress,
      reason: 'These therapeutic sounds help lower cortisol levels and create a peaceful mental environment.',
      priority: 'high'
    });
  }

  if (soundNeeds.includes('focus') || soundNeeds.includes('concentration') || moodState === 'distracted') {
    recommendations.push({
      category: 'focus-enhancement',
      sounds: soundLibrary.focus,
      reason: 'Optimized soundscapes that improve concentration and cognitive performance.',
      priority: 'medium'
    });
  }

  if (soundNeeds.includes('sleep') || moodState === 'tired' || moodState === 'insomnia') {
    recommendations.push({
      category: 'sleep-support',
      sounds: soundLibrary.sleep,
      reason: 'Sleep-enhancing soundscapes that promote deep, restorative rest.',
      priority: 'high'
    });
  }

  if (soundNeeds.includes('energy') || moodState === 'low-energy' || moodState === 'fatigued') {
    recommendations.push({
      category: 'energy-boost',
      sounds: soundLibrary.energy,
      reason: 'Uplifting sounds that naturally boost energy and motivation.',
      priority: 'medium'
    });
  }

  if (moodState === 'depressed' || moodState === 'sad' || keyThemes.includes('depression')) {
    recommendations.push({
      category: 'mood-lifting',
      sounds: soundLibrary.depression,
      reason: 'Therapeutic frequencies and nature sounds designed to lift mood and promote emotional healing.',
      priority: 'high'
    });
  }

  if (soundNeeds.includes('creativity') || keyThemes.includes('creative')) {
    recommendations.push({
      category: 'creative-enhancement',
      sounds: soundLibrary.creativity,
      reason: 'Sounds that enhance creative thinking and artistic expression.',
      priority: 'medium'
    });
  }

  // Add general wellness if no specific recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'general-wellness',
      sounds: [
        soundLibrary.anxiety[0], // Ocean waves
        soundLibrary.focus[0],   // Brown noise
        soundLibrary.sleep[0]   // Deep ocean
      ],
      reason: 'A curated selection of therapeutic sounds for overall emotional wellness and balance.',
      priority: 'low'
    });
  }

  // Sort by priority
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return recommendations.slice(0, 4); // Return top 4 recommendations
}

// Get default recommendations when no data is available
function getDefaultRecommendations() {
  return [
    {
      category: 'getting-started',
      sounds: [
        { name: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Natural calming sound for relaxation' },
        { name: 'Gentle Rain', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Soothing precipitation sounds' },
        { name: 'Brown Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Deep, rich sound for focus' }
      ],
      reason: 'Welcome to Dhwani! These are some popular therapeutic sounds to get you started on your wellness journey.'
    }
  ];
}

// Helper functions for parsing AI responses
function extractMoodState(text) {
  const moodKeywords = ['anxious', 'stressed', 'calm', 'focused', 'tired', 'energetic', 'sad', 'happy', 'neutral'];
  const lowerText = text.toLowerCase();

  for (const mood of moodKeywords) {
    if (lowerText.includes(mood)) {
      return mood;
    }
  }
  return 'neutral';
}

function extractThemes(text) {
  const themes = [];
  const themeKeywords = {
    stress: ['stress', 'anxiety', 'overwhelm', 'tension'],
    focus: ['focus', 'concentration', 'attention', 'productivity'],
    sleep: ['sleep', 'insomnia', 'rest', 'fatigue'],
    energy: ['energy', 'motivation', 'tired', 'low-energy'],
    creativity: ['creative', 'inspiration', 'artistic', 'imagination'],
    depression: ['sad', 'depressed', 'low-mood', 'hopeless']
  };

  const lowerText = text.toLowerCase();

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      themes.push(theme);
    }
  }

  return themes.length > 0 ? themes : ['general_wellness'];
}

// Legacy function - kept for backward compatibility
function generateSoundRecommendations(analysis) {
  const recommendations = [];
  const summary = analysis.summary?.toLowerCase() || '';
  const suggestions = analysis.suggestions || '';

  // Define sound categories with their benefits
  const soundLibrary = {
    stress: [
      { name: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Reduces cortisol and promotes relaxation' },
      { name: 'Rain Forest', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural white noise for anxiety relief' },
      { name: 'Gentle Stream', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Calming water sounds for stress reduction' }
    ],
    focus: [
      { name: 'Brown Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Improves concentration and blocks distractions' },
      { name: 'White Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Enhances focus and productivity' }
    ],
    energy: [
      { name: 'Upbeat Forest', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural energy boost with gentle stimulation' }
    ],
    sleep: [
      { name: 'Deep Ocean', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Promotes deep sleep and relaxation' },
      { name: 'Night Rain', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Soothing sounds for better sleep quality' }
    ]
  };

  // Analyze mood and recommend appropriate sounds
  if (summary.includes('stress') || summary.includes('anxiety') || summary.includes('overwhelm')) {
    recommendations.push({
      category: 'stress',
      sounds: soundLibrary.stress,
      reason: 'Based on your recent entries showing stress patterns, these calming sounds can help reduce anxiety and promote relaxation.'
    });
  }

  if (summary.includes('focus') || summary.includes('concentration') || summary.includes('study')) {
    recommendations.push({
      category: 'focus',
      sounds: soundLibrary.focus,
      reason: 'These sounds are optimized for concentration and can help improve your focus during work or study sessions.'
    });
  }

  if (summary.includes('tired') || summary.includes('low energy') || summary.includes('fatigue')) {
    recommendations.push({
      category: 'energy',
      sounds: soundLibrary.energy,
      reason: 'Gentle, uplifting sounds to help boost your energy levels naturally.'
    });
  }

  if (summary.includes('sleep') || summary.includes('insomnia') || suggestions.includes('sleep')) {
    recommendations.push({
      category: 'sleep',
      sounds: soundLibrary.sleep,
      reason: 'These soothing soundscapes are designed to promote better sleep quality and relaxation.'
    });
  }

  // Default recommendations if no specific mood detected
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'general',
      sounds: [
        soundLibrary.stress[0], // Ocean waves as default
        soundLibrary.focus[0]  // Brown noise as default
      ],
      reason: 'A balanced selection of calming and focusing sounds for general wellness.'
    });
  }

  return recommendations;
}

// POST /soundscape/generate - Generate adaptive soundscape (protected)
router.post('/generate', requireAuth, (req, res) => {
  // TODO: Integrate Web Audio API and biometrics
  res.json({ url: '/audio/focus-soundscape.mp3' });
});

// POST /soundscape/recommend - Get AI-powered sound recommendations (protected)
router.post('/recommend', requireAuth, async (req, res) => {
  console.log('Soundscape /recommend route HIT!');
  try {
    const userId = req.user.uid;
    console.log('Soundscape recommend called for userId:', userId);

    // Collect comprehensive data from all sources
    const userData = await collectUserData(userId);

    console.log(`Collected data: Journals: ${userData.journals.length}, Health: ${userData.health.length}, Mood: ${userData.mood.length}, Manthan: ${userData.manthan.length}`);

    // Debug: Log some sample data
    if (userData.journals.length > 0) {
      console.log('Sample journal entry:', userData.journals[0]);
    }
    if (userData.manthan.length > 0) {
      console.log('Sample manthan session:', userData.manthan[0]);
    }

    // TEMPORARY: If no data found, create some sample data for testing
    if (userData.journals.length === 0 && userData.health.length === 0 && userData.mood.length === 0 && userData.manthan.length === 0) {
      console.log('No user data found, creating sample data for testing');
      userData.journals = [
        {
          content: "I've been feeling quite stressed lately with work deadlines and family responsibilities. The constant pressure is making it hard to relax and enjoy the moment.",
          createdAt: new Date(),
          mood: "stressed",
          tags: ["stress", "work", "family"]
        },
        {
          content: "Today was a good day. I managed to complete my tasks and spent some quality time with loved ones. Feeling grateful for the small moments of joy.",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          mood: "grateful",
          tags: ["gratitude", "family", "productivity"]
        }
      ];

      userData.manthan = [
        {
          type: "reflection",
          emotionalState: "anxious",
          responses: ["I feel overwhelmed by responsibilities", "I need to practice self-care"],
          createdAt: new Date()
        }
      ];

      userData.mood = [
        { mood: "stressed", intensity: 7, createdAt: new Date() },
        { mood: "calm", intensity: 3, createdAt: new Date(Date.now() - 86400000) }
      ];
    }

    // If no data found, return helpful message with debug info
    if (userData.journals.length === 0 && userData.health.length === 0 && userData.mood.length === 0 && userData.manthan.length === 0) {
      console.log('No user data found, returning default recommendations');
      return res.json({
        recommendations: getDefaultRecommendations(),
        analysis: {
          summary: 'Welcome to Dhwani! Start by writing in your journal or using Manthan to help our AI understand your needs better.',
          moodState: 'neutral',
          confidence: 0.5,
          debug: {
            userId: userId,
            dataFound: {
              journals: userData.journals.length,
              health: userData.health.length,
              mood: userData.mood.length,
              manthan: userData.manthan.length
            }
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Perform advanced AI analysis
    const analysis = await performAdvancedAnalysis(userData);

    // Generate personalized sound recommendations
    const recommendations = generatePersonalizedRecommendations(analysis, userData);

    res.json({
      recommendations,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sound recommendation error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

// Helper function to generate sound recommendations based on mood analysis
function generateSoundRecommendations(analysis) {
  const recommendations = [];
  const summary = analysis.summary?.toLowerCase() || '';
  const suggestions = analysis.suggestions || '';

  // Define sound categories with their benefits
  const soundLibrary = {
    stress: [
      { name: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Reduces cortisol and promotes relaxation' },
      { name: 'Rain Forest', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural white noise for anxiety relief' },
      { name: 'Gentle Stream', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Calming water sounds for stress reduction' }
    ],
    focus: [
      { name: 'Brown Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Improves concentration and blocks distractions' },
      { name: 'White Noise', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b5b9b.mp3', benefit: 'Enhances focus and productivity' }
    ],
    energy: [
      { name: 'Upbeat Forest', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Natural energy boost with gentle stimulation' }
    ],
    sleep: [
      { name: 'Deep Ocean', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b7b7.mp3', benefit: 'Promotes deep sleep and relaxation' },
      { name: 'Night Rain', url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5e2.mp3', benefit: 'Soothing sounds for better sleep quality' }
    ]
  };

  // Analyze mood and recommend appropriate sounds
  if (summary.includes('stress') || summary.includes('anxiety') || summary.includes('overwhelm')) {
    recommendations.push({
      category: 'stress',
      sounds: soundLibrary.stress,
      reason: 'Based on your recent entries showing stress patterns, these calming sounds can help reduce anxiety and promote relaxation.'
    });
  }

  if (summary.includes('focus') || summary.includes('concentration') || summary.includes('study')) {
    recommendations.push({
      category: 'focus',
      sounds: soundLibrary.focus,
      reason: 'These sounds are optimized for concentration and can help improve your focus during work or study sessions.'
    });
  }

  if (summary.includes('tired') || summary.includes('low energy') || summary.includes('fatigue')) {
    recommendations.push({
      category: 'energy',
      sounds: soundLibrary.energy,
      reason: 'Gentle, uplifting sounds to help boost your energy levels naturally.'
    });
  }

  if (summary.includes('sleep') || summary.includes('insomnia') || suggestions.includes('sleep')) {
    recommendations.push({
      category: 'sleep',
      sounds: soundLibrary.sleep,
      reason: 'These soothing soundscapes are designed to promote better sleep quality and relaxation.'
    });
  }

  // Default recommendations if no specific mood detected
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'general',
      sounds: [
        soundLibrary.stress[0], // Ocean waves as default
        soundLibrary.focus[0]  // Brown noise as default
      ],
      reason: 'A balanced selection of calming and focusing sounds for general wellness.'
    });
  }

  return recommendations;
}

module.exports = router;
