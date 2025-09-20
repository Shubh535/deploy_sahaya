const express = require('express');
const router = express.Router();
const { auth } = require('../firebase');

// POST /auth/register - Register user (email/password)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const userRecord = await auth.createUser({ email, password });
    res.json({ success: true, uid: userRecord.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login - Login user (email/password)
// Note: Firebase Admin SDK does not support password login, so this is for reference only.
// Use Firebase Client SDK on frontend for login and send JWT to backend for verification.

// POST /auth/verify - Verify Firebase JWT
router.post('/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const decoded = await auth.verifyIdToken(token);
    res.json({ success: true, uid: decoded.uid, decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
