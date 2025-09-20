// routes/health.js
// Backend route for Google Fit/Health Connect integration
// Handles storing and retrieving user health metrics (steps, heart rate, sleep, etc.)

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

// POST /api/health - Store/update health metrics for a user
router.post('/', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { steps, heartRate, sleep, timestamp } = req.body;
  console.log('POST /api/health', { uid, body: req.body });
  try {
    await admin.firestore().collection('health').doc(uid).set({
      steps,
      heartRate,
      sleep,
      timestamp: timestamp || Date.now(),
    }, { merge: true });
    console.log('Health data saved for', uid);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving health data:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health - Retrieve health metrics for a user
router.get('/', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  try {
    const doc = await admin.firestore().collection('health').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'No health data found' });
    }
    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
