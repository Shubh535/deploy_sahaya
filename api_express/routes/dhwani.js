const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { generateGeminiResponse } = require('../vertexService');

// POST /api/dhwani/generate - Generate guided meditation script
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { theme, duration = 5, mood, background } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    // Create a prompt for generating a guided meditation script
    const prompt = `Create a ${duration}-minute guided meditation script for the theme "${theme}". 

${mood ? `The user is currently feeling: ${mood}. Incorporate this into the guidance.` : ''}
${background ? `Background context: ${background}` : ''}

Guidelines:
- Structure: Opening (1 min), Main guidance (3-4 min), Closing (1 min)
- Use soothing, present-moment language
- Include breathing exercises and body awareness
- Keep it compassionate and non-judgmental
- End with gentle return to awareness
- Format as a script with timing cues like [0:00], [1:00], etc.
- Make it suitable for audio narration

Return the script as plain text with timing markers.`;

    const script = await generateGeminiResponse(prompt, {
      temperature: 0.8,
      maxTokens: 1000
    });

    // Check if the response contains an error
    if (script.error) {
      console.error('AI script generation error:', script.message);
      return res.status(500).json({ error: 'Failed to generate meditation script', details: script.message });
    }

    res.json({
      script,
      theme,
      duration,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error generating meditation script:', err);
    res.status(500).json({ error: 'Failed to generate meditation script' });
  }
});

// POST /api/dhwani/soundscape - Generate ambient sound descriptions
router.post('/soundscape', requireAuth, async (req, res) => {
  try {
    const { environment, mood, duration = 10 } = req.body;

    const prompt = `Create a ${duration}-minute ambient soundscape description for "${environment}" environment.

${mood ? `Adapt the sounds to enhance this mood: ${mood}` : ''}

Describe the sounds in a way that can be used for audio generation or imagination:
- Layer multiple sound elements
- Include natural transitions
- Use descriptive, immersive language
- Structure by time segments
- Focus on calming, therapeutic sounds

Format as a script with timing cues.`;

    const soundscape = await generateGeminiResponse(prompt, {
      temperature: 0.7,
      maxTokens: 800
    });

    // Check if the response contains an error
    if (soundscape.error) {
      console.error('AI soundscape generation error:', soundscape.message);
      return res.status(500).json({ error: 'Failed to generate soundscape', details: soundscape.message });
    }

    res.json({
      soundscape,
      environment,
      mood,
      duration,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error generating soundscape:', err);
    res.status(500).json({ error: 'Failed to generate soundscape' });
  }
});

module.exports = router;