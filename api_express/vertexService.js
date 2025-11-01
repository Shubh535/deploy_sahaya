// Vertex AI service for Gemini API integration
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log('Gemini Service initialized:');
console.log('- API Key present:', !!API_KEY);
console.log('- API Key starts with:', API_KEY ? API_KEY.substring(0, 20) + '...' : 'NONE');
console.log('- Gemini Model:', GEMINI_MODEL);
console.log('- Gemini API URL:', GEMINI_API_URL);

async function generateGeminiResponse(prompt, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    responseMimeType,
    fallbackText
  } = options;

  console.log('\n=== Gemini API Call ===');
  console.log('Prompt length:', prompt.length);
  console.log('Options:', { temperature, maxTokens, responseMimeType: responseMimeType || 'none' });

  if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not configured!');
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const apiUrl = `${GEMINI_API_URL}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${API_KEY}`;
    console.log('Calling Gemini API:', apiUrl.replace(API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(apiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(responseMimeType ? { responseMimeType } : {}),
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('Gemini API Error Response:', response.status, response.statusText);
      console.error('Error details:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} — ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API Response received, candidates:', data?.candidates?.length || 0);

    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
    const firstCandidate = candidates[0] || {};
    const parts = Array.isArray(firstCandidate?.content?.parts)
      ? firstCandidate.content.parts
      : [];

    const textChunks = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean);

    const combinedText = textChunks.join('\n').trim();
    
    console.log('Generated text length:', combinedText.length);
    console.log('First 100 chars:', combinedText.substring(0, 100));

    if (combinedText) {
      return combinedText;
    }

    if (fallbackText) {
      console.log('Using fallback text (empty response)');
      return fallbackText;
    }

    console.error('Empty Gemini response, finishReason:', firstCandidate.finishReason || 'unknown');
    throw new Error(`Gemini response was empty (finishReason: ${firstCandidate.finishReason || 'unknown'})`);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    console.error('Stack:', error.stack);
    if (fallbackText) {
      console.log('Returning fallback text due to error');
      return fallbackText;
    }
    return {
      error: true,
      message: `Failed to generate Gemini response: ${error.message}`,
      text: 'AI analysis failed. Please try again later.'
    };
  }
}

// Alias for backward compatibility
async function generateText(prompt, options = {}) {
  return generateGeminiResponse(prompt, options);
}

module.exports = { generateGeminiResponse, generateText };