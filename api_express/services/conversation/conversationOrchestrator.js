const { generateResponse: generateGeminiResponse } = require('./geminiClient');
const { fetchUserContext, recordConversationTurn } = require('./memoryAdapter');
const { analyzeEmotion, DEFAULT_ANALYSIS } = require('./emotionAnalyzer');

const SAFE_DEFAULT_RESPONSE = 'I am here with you. Would you like to tell me more?';
const MAX_HISTORY_LENGTH = 15;

function sanitizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item.text === 'string')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      text: item.text.trim()
    }))
    .slice(-MAX_HISTORY_LENGTH);
}

async function runConversationTurn({
  userId,
  message,
  mode = 'listener',
  language = 'en',
  history = [],
  metadata = {}
}) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('A non-empty message is required');
  }

  const warnings = [];
  const safeHistory = sanitizeHistory(history);

  let memoryContext = { facts: [] };
  if (userId) {
    try {
      const fetchedMemory = await fetchUserContext(userId);
      if (fetchedMemory && typeof fetchedMemory === 'object') {
        memoryContext = fetchedMemory;
        if (Array.isArray(fetchedMemory.warnings)) {
          warnings.push(...fetchedMemory.warnings);
        }
      }
    } catch (error) {
      warnings.push('Memory fetch failed; proceeding without stored context.');
      console.warn('[conversationOrchestrator] memory fetch error:', error);
    }
  }

  let emotionAnalysis = { analysis: DEFAULT_ANALYSIS, warnings: [] };
  try {
    emotionAnalysis = await analyzeEmotion({
      message,
      history: safeHistory,
      language,
      mode
    });
    if (Array.isArray(emotionAnalysis?.warnings) && emotionAnalysis.warnings.length) {
      warnings.push(...emotionAnalysis.warnings);
    }
  } catch (error) {
    warnings.push('Emotion analysis failed; proceeding with default empathy cues.');
    console.warn('[conversationOrchestrator] emotion analysis error:', error);
    emotionAnalysis = { analysis: DEFAULT_ANALYSIS, warnings: [] };
  }

  const emotionInsights = emotionAnalysis.analysis || DEFAULT_ANALYSIS;

  let geminiResult;
  try {
    geminiResult = await generateGeminiResponse({
      emotionInsights,
      message,
      history: safeHistory,
      mode,
      language,
      memoryContext
    });
  } catch (error) {
    console.error('[conversationOrchestrator] Gemini generation failed:', error);
    geminiResult = {
      text: SAFE_DEFAULT_RESPONSE,
      language,
      meta: {
        warnings: ['Gemini generation threw an exception. Falling back to default response.']
      }
    };
  }

  const baseResponseText = geminiResult?.text?.trim() || SAFE_DEFAULT_RESPONSE;
  const finalEmotion = emotionInsights?.emotion || {
    label: 'unknown',
    confidence: 0,
    intensity: 0
  };

  if (geminiResult?.meta?.warnings) {
    warnings.push(...geminiResult.meta.warnings);
  }

  const geminiMeta = {
    ...(geminiResult?.meta || {}),
    emotion: finalEmotion,
    emotionInsights
  };

  try {
    const recordResult = await recordConversationTurn({
      userId,
      request: message,
      response: baseResponseText,
      metadata: {
        mode,
        language,
        gemini: geminiMeta,
        emotionAnalysis: emotionInsights,
        client: metadata?.client || {}
      }
    });

    if (recordResult?.warnings) {
      warnings.push(...recordResult.warnings);
    }
  } catch (error) {
    warnings.push('Memory write failed; conversation turn not persisted.');
    console.warn('[conversationOrchestrator] memory write error:', error);
  }

  return {
    response: {
      text: baseResponseText,
      language: geminiResult?.language || language
    },
    emotion: finalEmotion,
    memory: {
      retrieved: Array.isArray(memoryContext?.facts) ? memoryContext.facts : [],
      updates: []
    },
    meta: {
      userId,
      mode,
      language: geminiResult?.language || language,
      warnings,
      gemini: geminiMeta,
      emotionAnalysis: emotionInsights,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = {
  runConversationTurn
};
