const express = require('express');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');
const { analyzeMoodAI } = require('../gcloud'); // Gemini AI integration

const router = express.Router();
const db = admin.firestore();

// POST /api/digital-twin/analyze
// Runs AI analysis on user's journal, health, and nudge data
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    // Fetch user data for analysis
    const [journalSnap, healthSnap, twinSnap] = await Promise.all([
      db.collection('journals').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('health').doc(userId).get(),
      db.collection('digitalTwins').doc(userId).get(),
    ]);
    const journalEntries = journalSnap.docs.map(doc => doc.data().entry || '').join('\n');
    const healthData = healthSnap.exists ? healthSnap.data() : {};
    const twinData = twinSnap.exists ? twinSnap.data() : {};

    // Call Gemini AI model
    const aiInsights = await analyzeMoodAI({
      journal: journalEntries,
      health: healthData,
      mood: twinData.mood || null,
    });

    // Save insights to digital twin
    await db.collection('digitalTwins').doc(userId).set({
      aiInsights,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ aiInsights });
  } catch (error) {
    console.error('POST /api/digital-twin/analyze error:', error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

module.exports = router;
