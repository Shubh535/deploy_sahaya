const { generateGeminiResponse } = require('../../vertexService');
const { coerceLanguage } = require('./promptConfig');

const DEFAULT_ANALYSIS = {
  emotion: {
    label: 'calm',
    intensity: 0.2,
    confidence: 0.5
  },
  sentiment: 'neutral',
  needs: [],
  strategy: {
    type: 'validate',
    rationale: 'Offer gentle acknowledgement and invite sharing.',
    followUpQuestion: 'Would you like to tell me more about how you are feeling right now?'
  },
  tone: {
    style: 'warm',
    keywords: ['gentle', 'supportive']
  }
};

const EMOTION_PROMPT_TEMPLATE = ({
  latestMessage,
  historySnippet,
  language
}) => `Analyze emotion in: "${latestMessage.substring(0, 100)}"

Output JSON:
{"emotion":{"label":"anxious","intensity":0.7,"confidence":0.8},"sentiment":"negative","needs":["support"],"strategy":{"type":"validate","rationale":"Acknowledge feelings","followUpQuestion":"What worries you most?"},"tone":{"style":"warm","keywords":["gentle","supportive"]}}`;

function formatHistorySnippet(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return 'No prior context.';
  }

  return history
    .slice(-2) // Limit to last 2 messages
    .map((turn) => {
      const role = turn.role === 'assistant' ? 'Mitra' : 'Learner';
      const text = typeof turn.text === 'string' ? turn.text.trim().substring(0, 100) : ''; // Truncate to 100 chars
      return text ? `${role}: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

async function analyzeEmotion({
  message,
  history = [],
  language = 'en',
  mode = 'listener'
}) {
  const safeLanguage = coerceLanguage(mode, language);
  const historySnippet = formatHistorySnippet(history);
  const prompt = EMOTION_PROMPT_TEMPLATE({
    latestMessage: message,
    historySnippet,
    language: safeLanguage
  });

  try {
    const response = await generateGeminiResponse(prompt, {
      temperature: 0.2,
      maxTokens: 500
    });

    if (typeof response !== 'string') {
      return {
        analysis: DEFAULT_ANALYSIS,
        warnings: ['Emotion analysis returned a non-string payload; using default guidance.']
      };
    }

    const cleaned = response.trim().replace(/^```json\s*|```$/g, '');
    const parsed = JSON.parse(cleaned);

    return {
      analysis: {
        emotion: {
          label: parsed?.emotion?.label || DEFAULT_ANALYSIS.emotion.label,
          intensity: clamp(parsed?.emotion?.intensity, 0, 1, DEFAULT_ANALYSIS.emotion.intensity),
          confidence: clamp(parsed?.emotion?.confidence, 0, 1, DEFAULT_ANALYSIS.emotion.confidence)
        },
        sentiment: normalizeSentiment(parsed?.sentiment) || DEFAULT_ANALYSIS.sentiment,
        needs: Array.isArray(parsed?.needs) ? parsed.needs.filter(isNonEmptyString) : DEFAULT_ANALYSIS.needs,
        strategy: {
          type: normalizeStrategy(parsed?.strategy?.type) || DEFAULT_ANALYSIS.strategy.type,
          rationale: ensureSentence(parsed?.strategy?.rationale) || DEFAULT_ANALYSIS.strategy.rationale,
          followUpQuestion: ensureSentence(parsed?.strategy?.followUpQuestion) || DEFAULT_ANALYSIS.strategy.followUpQuestion
        },
        tone: {
          style: ensureSentence(parsed?.tone?.style) || DEFAULT_ANALYSIS.tone.style,
          keywords: Array.isArray(parsed?.tone?.keywords)
            ? parsed.tone.keywords.filter(isNonEmptyString).slice(0, 4)
            : DEFAULT_ANALYSIS.tone.keywords
        }
      },
      warnings: []
    };
  } catch (error) {
    console.warn('[emotionAnalyzer] Gemini emotion analysis failed:', error);
    return {
      analysis: DEFAULT_ANALYSIS,
      warnings: ['Emotion analysis failed; reverting to default compassionate strategy.']
    };
  }
}

function clamp(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.min(Math.max(num, min), max);
  }
  return fallback;
}

function normalizeSentiment(value) {
  if (typeof value !== 'string') return null;
  const normal = value.toLowerCase().trim();
  if (['positive', 'neutral', 'negative'].includes(normal)) {
    return normal;
  }
  return null;
}

function normalizeStrategy(value) {
  if (typeof value !== 'string') return null;
  const normal = value.toLowerCase().trim();
  if (['validate', 'normalize', 'reframe', 'encourage', 'coach'].includes(normal)) {
    return normal;
  }
  return null;
}

function ensureSentence(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?')
    ? trimmed
    : `${trimmed}.`;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

module.exports = {
  analyzeEmotion,
  DEFAULT_ANALYSIS
};
