const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');

const API_KEY = process.env.GEMINI_API_KEY;

// POST /api/imagen/generate - Generate AI image based on prompt
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { prompt, style = 'abstract', size = '512x512' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    // For now, we'll create procedural SVG-based "mood art" that represents the emotional state
    // In a real implementation, you'd use Google Cloud Imagen API or other image generation services

    const colors = {
      positive: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'],
      negative: ['#fca5a5', '#f87171', '#ef4444', '#dc2626'],
      neutral: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706']
    };

    // Determine mood from prompt
    let mood = 'neutral';
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('positive') || lowerPrompt.includes('happy') || lowerPrompt.includes('joy') ||
        lowerPrompt.includes('excited') || lowerPrompt.includes('grateful') || lowerPrompt.includes('peaceful')) {
      mood = 'positive';
    } else if (lowerPrompt.includes('negative') || lowerPrompt.includes('sad') || lowerPrompt.includes('angry') ||
               lowerPrompt.includes('anxious') || lowerPrompt.includes('frustrated') || lowerPrompt.includes('overwhelmed')) {
      mood = 'negative';
    }

    const moodColors = colors[mood];

    // Create an abstract SVG art piece that represents the emotional state
    const svgArt = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${moodColors[0]};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${moodColors[1]};stop-opacity:0.3" />
        </radialGradient>
        <radialGradient id="grad2" cx="30%" cy="70%" r="40%">
          <stop offset="0%" style="stop-color:${moodColors[2]};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${moodColors[3]};stop-opacity:0.2" />
        </radialGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="512" height="512" fill="url(#grad1)"/>

      <!-- Abstract shapes representing emotions -->
      <circle cx="200" cy="200" r="80" fill="url(#grad2)" opacity="0.7" filter="url(#blur)"/>
      <ellipse cx="350" cy="300" rx="60" ry="90" fill="${moodColors[1]}" opacity="0.5" transform="rotate(15 350 300)"/>
      <path d="M 100 400 Q 200 350 300 400 Q 400 450 500 400 L 500 512 L 100 512 Z"
            fill="${moodColors[2]}" opacity="0.4"/>

      <!-- Organic flowing lines representing emotional flow -->
      <path d="M 50 100 Q 150 80 250 120 Q 350 100 450 130"
            stroke="${moodColors[3]}" stroke-width="3" fill="none" opacity="0.6"/>
      <path d="M 70 200 Q 170 180 270 220 Q 370 200 470 230"
            stroke="${moodColors[0]}" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M 30 300 Q 130 280 230 320 Q 330 300 430 330"
            stroke="${moodColors[1]}" stroke-width="4" fill="none" opacity="0.4"/>

      <!-- Emotional energy bursts -->
      <circle cx="150" cy="150" r="20" fill="${moodColors[0]}" opacity="0.3"/>
      <circle cx="400" cy="180" r="15" fill="${moodColors[1]}" opacity="0.4"/>
      <circle cx="280" cy="380" r="25" fill="${moodColors[2]}" opacity="0.2"/>
    </svg>`;

    // Convert SVG to base64
    const svgBase64 = Buffer.from(svgArt).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    res.json({
      imageBase64: svgBase64,
      imageUrl: dataUrl,
      prompt: prompt,
      style: style,
      size: size,
      mood: mood,
      message: 'Mood art generated successfully'
    });

  } catch (err) {
    console.error('Error generating image:', err);
    res.status(500).json({
      error: 'Failed to generate image',
      message: 'Image generation is currently unavailable'
    });
  }
});

module.exports = router;
