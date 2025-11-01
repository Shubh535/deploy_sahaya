// routes/health.js
// Backend route for Sahay Sense - Intelligent Wellness Companion
// Handles comprehensive health tracking: sleep, activity, mood, nutrition, goals, streaks, badges

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');
const db = admin.firestore();

// POST /api/health - Store/update daily health metrics for a user
router.post('/', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { 
    steps, 
    heartRate, 
    sleep, 
    sleepQuality,      // 1-10 rating
    activityLevel,     // low, moderate, high
    activityDescription, // e.g., "Evening walk", "Yoga session"
    waterIntake,       // glasses/liters
    stressLevel,       // 1-10 rating
    mood,              // happy, calm, anxious, stressed, energetic, tired
    screenTime,        // minutes
    nutritionLog,      // array of meals: [{ type: 'breakfast', description: 'Oats with fruits', time: timestamp }]
    notes,             // free-form notes
    timestamp 
  } = req.body;
  
  console.log('POST /api/health', { uid, hasNutrition: !!nutritionLog });
  
  try {
    const date = new Date(timestamp || Date.now());
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Store daily entry
    const entryData = {
      steps: steps || 0,
      heartRate: heartRate || null,
      sleep: sleep || 0,
      sleepQuality: sleepQuality || null,
      activityLevel: activityLevel || 'low',
      activityDescription: activityDescription || '',
      waterIntake: waterIntake || 0,
      stressLevel: stressLevel || null,
      mood: mood || 'neutral',
      screenTime: screenTime || 0,
      nutritionLog: nutritionLog || [],
      notes: notes || '',
      timestamp: date.getTime(),
      dateKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to user's health_entries collection
    await db.collection('health_entries')
      .doc(uid)
      .collection('entries')
      .doc(dateKey)
      .set(entryData, { merge: true });

    // Update user's latest health snapshot
    await db.collection('health').doc(uid).set({
      latest: entryData,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Calculate and update streak
    await updateStreak(uid, dateKey);

    console.log('Health data saved for', uid, 'on', dateKey);
    res.status(200).json({ success: true, dateKey, streak: await getStreak(uid) });
  } catch (err) {
    console.error('Error saving health data:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health - Retrieve latest health metrics for a user
router.get('/', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  try {
    const doc = await db.collection('health').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'No health data found' });
    }
    
    const data = doc.data();
    const streak = await getStreak(uid);
    const badges = await getBadges(uid);
    
    res.status(200).json({ 
      ...data.latest, 
      streak,
      badges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health/history - Get historical health data for trend analysis
router.get('/history', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { days = 7 } = req.query; // Default to last 7 days
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateKey = cutoffDate.toISOString().split('T')[0];
    
    const snapshot = await db.collection('health_entries')
      .doc(uid)
      .collection('entries')
      .where('dateKey', '>=', cutoffDateKey)
      .orderBy('dateKey', 'desc')
      .get();
    
    const entries = [];
    snapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json({ entries, count: entries.length });
  } catch (err) {
    console.error('Error fetching health history:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/health/goals - Set or update wellness goals
router.post('/goals', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { goals } = req.body; 
  // goals: [{ type: 'sleep', target: 8, description: 'Sleep 8 hrs for 3 days', deadline: timestamp }]
  
  try {
    await db.collection('health').doc(uid).set({
      goals: goals || [],
      goalsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health/streak - Get current streak information
router.get('/streak', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  try {
    const streak = await getStreak(uid);
    res.status(200).json({ streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Calculate and update user's logging streak
async function updateStreak(uid, currentDateKey) {
  try {
    const healthDoc = await db.collection('health').doc(uid).get();
    const data = healthDoc.data() || {};
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    let streak = data.streak || 0;
    const lastLoggedDate = data.lastLoggedDate;
    
    if (lastLoggedDate === currentDateKey) {
      // Same day, no streak change
      return;
    } else if (lastLoggedDate === yesterdayKey) {
      // Consecutive day
      streak += 1;
    } else {
      // Streak broken, restart
      streak = 1;
    }
    
    await db.collection('health').doc(uid).set({
      streak,
      lastLoggedDate: currentDateKey,
      streakUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Check for badge achievements
    await checkBadges(uid, streak);
    
  } catch (err) {
    console.error('Error updating streak:', err);
  }
}

// Helper: Get current streak
async function getStreak(uid) {
  try {
    const doc = await db.collection('health').doc(uid).get();
    return doc.data()?.streak || 0;
  } catch (err) {
    return 0;
  }
}

// Helper: Check and award badges based on achievements
async function checkBadges(uid, streak) {
  try {
    const doc = await db.collection('health').doc(uid).get();
    const badges = doc.data()?.badges || [];
    
    const newBadges = [];
    
    // Streak badges
    if (streak >= 3 && !badges.includes('streak_3')) {
      newBadges.push({ id: 'streak_3', name: 'Mindful Mornings', description: '3-day logging streak!', icon: '🌅', earnedAt: Date.now() });
    }
    if (streak >= 7 && !badges.includes('streak_7')) {
      newBadges.push({ id: 'streak_7', name: 'Weekly Warrior', description: '7-day logging streak!', icon: '💪', earnedAt: Date.now() });
    }
    if (streak >= 30 && !badges.includes('streak_30')) {
      newBadges.push({ id: 'streak_30', name: 'Wellness Champion', description: '30-day logging streak!', icon: '🏆', earnedAt: Date.now() });
    }
    
    if (newBadges.length > 0) {
      await db.collection('health').doc(uid).set({
        badges: [...badges, ...newBadges.map(b => b.id)],
        badgesEarned: admin.firestore.FieldValue.arrayUnion(...newBadges)
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }
}

// Helper: Get all earned badges
async function getBadges(uid) {
  try {
    const doc = await db.collection('health').doc(uid).get();
    return doc.data()?.badgesEarned || [];
  } catch (err) {
    return [];
  }
}

// POST /api/health/insights - Generate AI-powered wellness insights using Gemini
router.post('/insights', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const vertexService = require('../vertexService');
  
  try {
    // Get last 7 days of data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateKey = cutoffDate.toISOString().split('T')[0];
    
    const snapshot = await db.collection('health_entries')
      .doc(uid)
      .collection('entries')
      .where('dateKey', '>=', cutoffDateKey)
      .orderBy('dateKey', 'desc')
      .get();
    
    const entries = [];
    snapshot.forEach(doc => entries.push(doc.data()));
    
    if (entries.length === 0) {
      return res.status(200).json({ 
        insights: [{
          type: 'welcome',
          title: 'Welcome to Sahay Sense! 🌿',
          message: 'Start logging your daily wellness data to receive personalized insights and recommendations.',
          priority: 'info'
        }]
      });
    }
    
    // Calculate averages and patterns
    const avgSleep = entries.reduce((sum, e) => sum + (e.sleep || 0), 0) / entries.length;
    const avgStress = entries.filter(e => e.stressLevel).reduce((sum, e) => sum + e.stressLevel, 0) / entries.filter(e => e.stressLevel).length || 0;
    const avgWater = entries.reduce((sum, e) => sum + (e.waterIntake || 0), 0) / entries.length;
    const avgSteps = entries.reduce((sum, e) => sum + (e.steps || 0), 0) / entries.length;
    const avgScreenTime = entries.reduce((sum, e) => sum + (e.screenTime || 0), 0) / entries.length;
    
    const moodCounts = {};
    entries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    // Generate Gemini-powered micro-insights
    const prompt = `You are Sahay Sense, an empathetic wellness companion for students. Analyze this week's health data and provide 3-4 short, actionable micro-insights.

Health Summary (last 7 days):
- Average sleep: ${avgSleep.toFixed(1)} hours/night
- Average stress level: ${avgStress.toFixed(1)}/10
- Average water intake: ${avgWater.toFixed(1)} glasses/day
- Average steps: ${avgSteps.toFixed(0)} steps/day
- Average screen time: ${(avgScreenTime / 60).toFixed(1)} hours/day
- Dominant mood: ${dominantMood}

Requirements:
1. Sleep patterns - if < 7 hours, recommend more rest
2. Stress management - if > 6/10, suggest relaxation techniques
3. Hydration - if < 6 glasses, remind to drink more water
4. Activity - if < 5000 steps, encourage movement
5. Screen time - if > 6 hours/day, suggest breaks

IMPORTANT: Return ONLY a valid JSON array. Each insight must have this exact structure:
[
  {
    "type": "sleep",
    "title": "😴 Sleep Boost Needed",
    "message": "You've been averaging 5.2h of sleep. Try a 20-min afternoon nap!",
    "priority": "high"
  }
]

Do not include any markdown, explanations, or text outside the JSON array.`;

    console.log('Calling Gemini for insights...');
    const response = await vertexService.generateText(prompt);
    console.log('Gemini response received:', response.substring(0, 200));
    let insights = [];
    
    try {
      // Clean response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      insights = JSON.parse(cleanResponse);
      console.log('Successfully parsed', insights.length, 'insights from Gemini');
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', parseErr.message);
      console.error('Raw response:', response);
      // Fallback to rule-based insights if Gemini fails
      insights = generateRuleBasedInsights(avgSleep, avgStress, avgWater, avgSteps, avgScreenTime, dominantMood);
      console.log('Using', insights.length, 'fallback insights');
    }
    
    res.status(200).json({ insights, summary: { avgSleep, avgStress, avgWater, avgSteps, dominantMood } });
  } catch (err) {
    console.error('Error generating insights:', err);
    // Return rule-based fallback
    const entries = []; // Use empty for fallback
    const fallbackInsights = generateRuleBasedInsights(0, 0, 0, 0, 0, 'neutral');
    res.status(200).json({ insights: fallbackInsights });
  }
});

// Fallback rule-based insights
function generateRuleBasedInsights(avgSleep, avgStress, avgWater, avgSteps, avgScreenTime, dominantMood) {
  const insights = [];
  
  if (avgSleep < 7) {
    insights.push({
      type: 'sleep',
      title: '😴 Sleep Boost Needed',
      message: `You've been averaging ${avgSleep.toFixed(1)}h of sleep. Try a 20-min afternoon nap or an earlier bedtime to recharge!`,
      priority: 'high'
    });
  }
  
  if (avgStress > 6) {
    insights.push({
      type: 'stress',
      title: '🧘 Stress Relief Time',
      message: 'High stress detected. Try a 2-minute breathing exercise before study sessions!',
      priority: 'high'
    });
  }
  
  if (avgWater < 6) {
    insights.push({
      type: 'hydration',
      title: '💧 Hydration Check',
      message: 'Aim for 8 glasses of water daily. Set hourly reminders to stay refreshed!',
      priority: 'medium'
    });
  }
  
  if (avgSteps < 5000) {
    insights.push({
      type: 'activity',
      title: '🚶 Move More',
      message: 'Try a 10-minute walk between classes. Your brain will thank you!',
      priority: 'medium'
    });
  }
  
  if (avgScreenTime > 360) { // > 6 hours
    insights.push({
      type: 'screen',
      title: '👀 Screen Break',
      message: 'High screen time detected. Follow the 20-20-20 rule: every 20 min, look 20 feet away for 20 seconds.',
      priority: 'medium'
    });
  }
  
  if (dominantMood === 'anxious' || dominantMood === 'stressed') {
    insights.push({
      type: 'mood',
      title: '🌸 Mood Boost',
      message: `Notice your ${dominantMood} mood pattern? Try journaling or talking to a friend.`,
      priority: 'high'
    });
  }
  
  return insights.slice(0, 4); // Max 4 insights
}

// POST /api/health/nutrition - Get personalized nutrition suggestions using Gemini
router.post('/nutrition', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { mealType, activityLevel, studyIntensity, preferences } = req.body;
  // mealType: breakfast, lunch, dinner, snack
  // activityLevel: low, moderate, high
  // studyIntensity: light, moderate, intense
  
  const vertexService = require('../vertexService');
  
  try {
    const prompt = `You are Sahay Sense, a nutrition guide for students. Suggest 3 quick, healthy ${mealType || 'meal'} options perfect for students.

Context:
- Meal type: ${mealType || 'general meal'}
- Activity level: ${activityLevel || 'moderate'}
- Study intensity: ${studyIntensity || 'moderate'}
${preferences ? `- Dietary preferences: ${preferences}` : ''}

Requirements:
1. Student-budget friendly (affordable ingredients)
2. Quick to prepare (under 15 minutes)
3. Energy-sustaining for studying
4. Include nutritional benefits

IMPORTANT: Return ONLY a valid JSON array. Each meal must have this exact structure:
[
  {
    "name": "Yogurt Parfait with Nuts & Honey",
    "ingredients": ["Greek yogurt", "Mixed nuts", "Honey", "Berries"],
    "prepTime": "5 min",
    "benefits": "Protein-rich, brain-boosting omega-3s, natural energy",
    "calories": "~300 kcal"
  }
]

Do not include any markdown, explanations, or text outside the JSON array. Return exactly 3 meal suggestions.`;

    console.log('Calling Gemini for nutrition suggestions...', mealType);
    const response = await vertexService.generateText(prompt);
    console.log('Gemini nutrition response received:', response.substring(0, 200));
    let suggestions = [];
    
    try {
      // Clean response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      suggestions = JSON.parse(cleanResponse);
      console.log('Successfully parsed', suggestions.length, 'nutrition suggestions from Gemini');
    } catch (parseErr) {
      console.error('Failed to parse Gemini nutrition response:', parseErr.message);
      console.error('Raw response:', response);
      // Fallback suggestions
      console.log('Using fallback nutrition suggestions');
      suggestions = [
        {
          name: 'Yogurt Parfait with Nuts & Honey',
          ingredients: ['Greek yogurt', 'Mixed nuts', 'Honey', 'Fresh berries'],
          prepTime: '5 min',
          benefits: 'Protein-rich, brain-boosting omega-3s, natural energy from honey',
          calories: '~300 kcal'
        },
        {
          name: 'Whole Grain Toast with Peanut Butter & Banana',
          ingredients: ['Whole wheat bread', 'Peanut butter', 'Banana slices'],
          prepTime: '3 min',
          benefits: 'Complex carbs for sustained energy, potassium for focus',
          calories: '~350 kcal'
        },
        {
          name: 'Veggie Wrap with Hummus',
          ingredients: ['Whole wheat tortilla', 'Hummus', 'Lettuce', 'Tomato', 'Cucumber'],
          prepTime: '10 min',
          benefits: 'Fiber-rich, light yet filling, vitamins for alertness',
          calories: '~400 kcal'
        }
      ];
    }
    
    res.status(200).json({ suggestions, mealType, timestamp: Date.now() });
  } catch (err) {
    console.error('Error generating nutrition suggestions:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/health/chat - Conversational wellness assistant powered by Gemini
router.post('/chat', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { message, context } = req.body;
  // context: optional health data context for personalized responses
  
  const vertexService = require('../vertexService');
  
  try {
    // Get user's recent health data for context
    const healthDoc = await db.collection('health').doc(uid).get();
    const latestData = healthDoc.data()?.latest || {};
    
    const contextInfo = context || `Recent health data:
- Sleep: ${latestData.sleep || 'N/A'} hours
- Stress level: ${latestData.stressLevel || 'N/A'}/10
- Mood: ${latestData.mood || 'N/A'}
- Activity: ${latestData.activityLevel || 'N/A'}`;
    
    const prompt = `You are Sahay Sense, an empathetic wellness companion for students. Answer the student's question with warmth and actionable advice.

Student context:
${contextInfo}

Student asks: "${message}"

Guidelines:
- Be conversational and supportive (like a caring friend)
- Keep responses concise (2-4 sentences max)
- Ground advice in wellness research when possible
- Suggest practical, implementable actions
- Use emojis sparingly for warmth

Provide a direct, helpful response (no JSON, just natural text):`;

    console.log('Calling Gemini for chat response...');
    const response = await vertexService.generateText(prompt);
    console.log('Gemini chat response received, length:', response.length);
    
    // Store conversation for continuity
    await db.collection('health_conversations').add({
      uid,
      userMessage: message,
      botResponse: response,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ response, timestamp: Date.now() });
  } catch (err) {
    console.error('Error in health chat:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
