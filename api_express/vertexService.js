// Vertex AI service for Gemini API integration
const API_KEY = process.env.GEMINI_API_KEY;

async function generateGeminiResponse(prompt, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 800,
    responseMimeType,
    fallbackText
  } = options;

  try {
    console.log('Making Gemini API call with prompt:', prompt.substring(0, 100));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
        }),
      }
    );

    console.log('Gemini API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response data keys:', Object.keys(data));

    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
    const parts = candidates.flatMap(candidate =>
      Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
    );
    const textChunks = parts
      .map(part => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean);

    const combinedText = textChunks.join('\n').trim();

    if (combinedText) {
      return combinedText;
    }

    console.warn('Gemini response contained no text; finishReason:', candidates[0]?.finishReason);
    console.log('Candidates snapshot:', JSON.stringify(candidates.slice(0, 1)));

    if (fallbackText) {
      console.warn('Using provided fallback text due to empty Gemini response.');
      return fallbackText;
    }

    throw new Error('No response generated from Gemini API');
  } catch (error) {
    console.error('Gemini API error:', error);
    if (fallbackText) {
      console.warn('Returning fallback text after Gemini error.');
      return fallbackText;
    }
    // Instead of throwing, return an error object like gcloud.js does
    return {
      error: true,
      message: `Failed to generate Gemini response: ${error.message}`,
      text: 'AI analysis failed. Please try again later.'
    };
  }
}

module.exports = { generateGeminiResponse };