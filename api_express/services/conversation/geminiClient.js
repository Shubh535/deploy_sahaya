const { generateGeminiResponse } = require('../../vertexService');
const { buildPrompt, coerceLanguage, coerceMode } = require('./promptConfig');

const DEFAULT_OPTIONS = {
  temperature: 0.7,
  maxTokens: 1024
};

async function generateResponse({
  message,
  history,
  mode,
  language,
  memoryContext,
  emotionInsights = null,
  options = {}
}) {
  const safeMode = coerceMode(mode);
  const safeLanguage = coerceLanguage(safeMode, language);
  const prompt = buildPrompt({
    message,
    history,
    mode: safeMode,
    language: safeLanguage,
    memoryContext,
    emotionInsights
  });

  const generationOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  const result = await generateGeminiResponse(prompt, generationOptions);

  if (typeof result === 'string') {
    return {
      text: result.trim(),
      language: safeLanguage,
      meta: {
        promptLength: prompt.length,
        mode: safeMode,
        temperature: generationOptions.temperature,
        finishReason: 'text',
        warnings: []
      }
    };
  }

  if (result && result.error) {
    return {
      text: result.text || 'I am having trouble responding right now. Let us try again in a moment.',
      language: safeLanguage,
      meta: {
        promptLength: prompt.length,
        mode: safeMode,
        temperature: generationOptions.temperature,
        finishReason: 'error',
        warnings: [result.message || 'Gemini API returned an error.']
      }
    };
  }

  return {
    text: 'I am here with you. Could you please repeat that?',
    language: safeLanguage,
    meta: {
      promptLength: prompt.length,
      mode: safeMode,
      temperature: generationOptions.temperature,
        finishReason: 'empty',
      warnings: ['Gemini API returned an unexpected payload.']
    }
  };
}

module.exports = {
  generateResponse
};
