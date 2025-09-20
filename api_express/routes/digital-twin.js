const express = require('express');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const db = admin.firestore();

// Firestore collection: digitalTwins
// Document: userId
// Fields: mood (string), moodHistory (array), aiInsights (object), updatedAt (timestamp)

// Get current digital twin state
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const doc = await db.collection('digitalTwins').doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'No digital twin data found.' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('GET /api/digital-twin error:', error);
    res.status(500).json({ error: 'Failed to fetch digital twin data.' });
  }
});

// Update digital twin state (mood, moodHistory, aiInsights)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { mood, aiInsights } = req.body;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = db.collection('digitalTwins').doc(userId);
    const doc = await docRef.get();
    let moodHistory = [];
    if (doc.exists) {
      moodHistory = doc.data().moodHistory || [];
    }
    if (mood) {
      moodHistory.push({ mood, timestamp: new Date().toISOString() });
    }
    console.log('[POST /api/digital-twin] userId:', userId, 'body:', req.body, 'existing:', doc.exists ? doc.data() : null);
    await docRef.set({
      mood: mood || doc.data()?.mood || null,
      moodHistory,
      aiInsights: aiInsights || doc.data()?.aiInsights || {},
      updatedAt: now,
    }, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/digital-twin error:', error, 'body:', req.body);
    res.status(500).json({ error: 'Failed to update digital twin.', details: error.message });
  }
});

module.exports = router;
