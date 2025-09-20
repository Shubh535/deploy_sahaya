const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');

const admin = require('firebase-admin');

// GET /nudge/predict - Predictive wellness nudge (protected)
router.get('/predict', requireAuth, async (req, res) => {
  try {
    const { uid } = req.user;
    const doc = await admin.firestore().collection('health').doc(uid).get();
    let nudge = 'Take a mindful moment today!';
    if (doc.exists) {
      const health = doc.data();
      if (health.sleep !== undefined && health.sleep < 6) {
        nudge = 'You slept less than 6 hours. Try a short nap or meditation.';
      } else if (health.steps !== undefined && health.steps < 3000) {
        nudge = 'You walked less than 3,000 steps. A short walk can boost your mood!';
      } else if (health.heartRate !== undefined && health.heartRate > 100) {
        nudge = 'Your heart rate was high today. Take a few deep breaths.';
      }
    }
    res.json({ nudge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
