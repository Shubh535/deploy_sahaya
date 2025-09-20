// Vertex AI service for Gemini API integration
const API_KEY = process.env.GEMINI_API_KEY;

async function generateGeminiResponse(prompt, options = {}) {
  const { temperature = 0.7, maxTokens = 800 } = options;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No response generated from Gemini API');
    }

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate Gemini response: ${error.message}`);
  }
}

module.exports = { generateGeminiResponse };