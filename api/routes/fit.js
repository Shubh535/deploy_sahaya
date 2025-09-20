// routes/fit.js
// Google Fit OAuth2 and data sync backend route (scaffold)
// This route will handle the OAuth2 flow and fetch user health data from Google Fit

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

// TODO: Replace with your real credentials and redirect URI
const CLIENT_ID = process.env.GOOGLE_FIT_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_FIT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = process.env.GOOGLE_FIT_REDIRECT_URI || 'http://localhost:4000/api/fit/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Step 1: Start OAuth2 flow
router.get('/auth', authMiddleware, (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'profile',
    'email',
    'openid',
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: req.user.uid,
  });
  res.redirect(url);
});

// Step 2: OAuth2 callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing code or state');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Store tokens in Firestore for the user
    await admin.firestore().collection('fitTokens').doc(state).set(tokens);
    res.send('Google Fit connected! You can close this window.');
  } catch (err) {
    res.status(500).send('OAuth error: ' + err.message);
  }
});

// Step 3: Sync health data from Google Fit
router.post('/sync', authMiddleware, async (req, res) => {
  const { uid } = req.user;
  try {
    const tokenDoc = await admin.firestore().collection('fitTokens').doc(uid).get();
    if (!tokenDoc.exists) return res.status(400).json({ error: 'Google Fit not connected' });
    oauth2Client.setCredentials(tokenDoc.data());
    const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
    // Example: Fetch steps for the last day
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const stepsData = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
        startTimeMillis: oneDayAgo,
        endTimeMillis: now,
      },
    });
    // TODO: Parse and store steps, heart rate, sleep, etc. in Firestore/health
    res.json({ stepsData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
