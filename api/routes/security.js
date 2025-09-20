const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');
// POST /security/anonymize - Anonymize sensitive text using Cloud DLP (protected)
// Request body: { text: string }
// Response: { anonymized: string }
const { anonymizeText } = require('../gcloud');
router.post('/anonymize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const anonymized = await anonymizeText(text);
    res.json({ anonymized });
  } catch (err) {
    res.status(500).json({ error: 'DLP error', details: err.message });
  }
});

module.exports = router;
