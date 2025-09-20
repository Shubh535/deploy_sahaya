// Free Gemini API setup (no billing required)
const API_KEY = process.env.GEMINI_API_KEY; // Get from Google AI Studio

// Google Cloud DLP setup (for data anonymization)
const { DlpServiceClient } = require('@google-cloud/dlp');
const dlp = new DlpServiceClient();

async function anonymizeText(text) {
  try {
    const request = {
      parent: dlp.projectPath('websahaya-3900d'),
      item: { value: text },
      deidentifyConfig: {
        infoTypeTransformations: {
          transformations: [
            {
              infoTypes: [{ name: 'EMAIL_ADDRESS' }, { name: 'PHONE_NUMBER' }, { name: 'PERSON_NAME' }],
              primitiveTransformation: { replaceWithInfoTypeConfig: {} },
            },
          ],
        },
      },
      inspectConfig: {
        infoTypes: [
          { name: 'EMAIL_ADDRESS' },
          { name: 'PHONE_NUMBER' },
          { name: 'PERSON_NAME' },
        ],
      },
    };
    const [response] = await dlp.deidentifyContent(request);
    return response.item.value;
  } catch (error) {
    console.error('DLP anonymization error:', error);
    return text; // Return original text if anonymization fails
  }
}

// NLP-powered reframing for journal entries (CBT/DBT)
async function analyzeJournalEntry({ entry, language = 'en' }) {
  const prompt = `You are a compassionate mental health assistant trained in CBT and DBT. Given the following journal entry, analyze the sentiment and provide a reframing suggestion using evidence-based techniques.\n\nJournal Entry:\n${entry}\n\nRespond with a JSON object with keys: sentiment, reframing.`;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let aiResult = {};
    try {
      aiResult = JSON.parse(text);
    } catch {
      aiResult = { sentiment: 'unknown', reframing: text };
    }
    aiResult.aiGenerated = true;
    return aiResult;
  } catch (error) {
    console.error('Gemini journal analyze error:', error);
    return {
      sentiment: 'unknown',
      reframing: 'AI analysis failed. Please try again later.',
      aiGenerated: false,
      error: error.message,
    };
  }
}

async function chatWithGemini({ message, mode = 'listener', language = 'en', history = [], userId }) {
  // System prompt for mode and language
  let systemPrompt = '';
  if (mode === 'coach') {
    systemPrompt = 'You are Mitra, a supportive AI coach for students. Give practical advice, encouragement, and growth mindset tips.';
  } else if (mode === 'mindfulness') {
    systemPrompt = 'You are Mitra, a gentle mindfulness guide. Offer calming, meditative, and grounding responses.';
  } else {
    systemPrompt = 'You are Mitra, an empathetic listener. Respond with warmth, validation, and gentle questions.';
  }
  if (language === 'hi') {
    systemPrompt += ' Respond in Hindi.';
  } else {
    systemPrompt += ' Respond in English.';
  }

  // Build conversation history
  const historyText = history.map(msg => `${msg.role}: ${msg.text}`).join('\n');
  const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${message}\n\nMitra:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      }
    );
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI chat failed. Please try again later.';
    return { text, language, mode };
  } catch (error) {
    console.error('Gemini API chat error:', error);
    return { text: 'AI chat failed. Please try again later.', error: error.message, language, mode };
  }
}

async function analyzeMoodAI({ journal, health, mood }) {
  // Compose prompt for Gemini
  const prompt = `You are an empathetic mental wellness assistant. Analyze the following user data and provide a summary of their emotional state, mood trends, and any helpful insights or suggestions.\n\nRecent Journal Entries:\n${journal}\n\nHealth Data:\n${JSON.stringify(health)}\n\nCurrent Mood: ${mood || 'Not set'}\n\nRespond with a JSON object with keys: summary, moodTrends, suggestions.`;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to parse JSON from model output
    let aiInsights = {};
    try {
      aiInsights = JSON.parse(text);
    } catch {
      aiInsights = { summary: text };
    }
    aiInsights.aiGenerated = true;
    return aiInsights;
  } catch (error) {
    console.error('Gemini AI error:', error);
    return {
      summary: 'AI analysis failed. Please try again later.',
      aiGenerated: false,
      error: error.message,
    };
  }
}

module.exports = { anonymizeText, analyzeMoodAI, chatWithGemini, analyzeJournalEntry };
