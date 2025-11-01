const fs = require('fs');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

const DEFAULT_MODEL = process.env.VERTEX_GEMMA_MODEL || 'gemma-2-9b-it';
const DEFAULT_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const DEFAULT_PROJECT =
  process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'websahaya';
const SERVICE_ACCOUNT_PATH =
  process.env.VERTEX_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../../vertexServiceAccount.json');

let cachedModel = null;
let initialisationError = null;

function ensureModel() {
  if (cachedModel || initialisationError) {
    return { model: cachedModel, error: initialisationError };
  }

  try {
    const options = {
      project: DEFAULT_PROJECT,
      location: DEFAULT_LOCATION,
    };

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      options.googleAuthOptions = {};
    } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      options.googleAuthOptions = { keyFile: SERVICE_ACCOUNT_PATH };
    }

    const vertexAI = new VertexAI(options);
    cachedModel = vertexAI.getGenerativeModel({ model: DEFAULT_MODEL });
    return { model: cachedModel, error: null };
  } catch (error) {
    initialisationError = error;
    console.error('[gemmaClient] Failed to initialise Vertex AI Gemma model:', error);
    return { model: null, error };
  }
}

function buildPrompt({ text, language, strategySeeds }) {
  const emotionSeed = strategySeeds?.emotion || { label: 'unknown', confidence: 0 };
  const metaSeed = strategySeeds?.meta ? JSON.stringify(strategySeeds.meta, null, 2) : 'None provided';

  return `You are Gemma, an empathetic conversation co-pilot.
You will receive a draft response that should be compassionately refined before it reaches the user.

Guidelines:
- Preserve the user's core message while softening any abrupt or clinical language.
- Always respond in the target language (${language}).
- Keep the reply concise (max 6 sentences) and actionable when guidance is appropriate.
- Adjust tone to reflect the provided emotion seed (label: ${emotionSeed.label}, confidence: ${emotionSeed.confidence}).
- If the draft already looks good, make only subtle edits.
- Return strictly valid JSON adhering to the schema below. Do not include markdown.

Schema:
{
  "adjustedText": string,
  "emotion": {
    "label": string,
    "confidence": number (0-1)
  },
  "memoryUpdates": [
    {
      "summary": string,
      "confidence": number (0-1)
    }
  ]
}

Draft response:
"""
${text.trim()}
"""

Additional context/meta:
${metaSeed}

Respond now with JSON only.`;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse Gemma JSON response: ${error.message}`);
  }
}

function normaliseResult(rawResult, fallback) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('Gemma response missing or not an object.');
  }

  const adjustedText = typeof rawResult.adjustedText === 'string' && rawResult.adjustedText.trim()
    ? rawResult.adjustedText.trim()
    : fallback;

  const emotion = {
    label: typeof rawResult?.emotion?.label === 'string' ? rawResult.emotion.label : 'unknown',
    confidence:
      typeof rawResult?.emotion?.confidence === 'number'
        ? Math.min(Math.max(rawResult.emotion.confidence, 0), 1)
        : 0,
  };

  const memoryUpdates = Array.isArray(rawResult.memoryUpdates)
    ? rawResult.memoryUpdates
        .filter((item) => item && typeof item.summary === 'string' && item.summary.trim())
        .map((item) => ({
          summary: item.summary.trim(),
          confidence:
            typeof item.confidence === 'number'
              ? Math.min(Math.max(item.confidence, 0), 1)
              : 0.5,
        }))
    : [];

  return { adjustedText, emotion, memoryUpdates };
}

async function callGemmaModel(prompt) {
  const { model, error } = ensureModel();
  if (!model) {
    throw error || new Error('Gemma model is unavailable');
  }

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.45,
      topP: 0.85,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  });

  const candidates = result?.response?.candidates || [];
  const firstCandidate = candidates[0];
  const parts = firstCandidate?.content?.parts || [];
  const firstTextPart = parts.find((part) => typeof part?.text === 'string');

  if (!firstTextPart?.text) {
    throw new Error('Gemma returned no text content.');
  }

  return firstTextPart.text;
}

const DISABLE_REFINER = String(process.env.DISABLE_GEMMA_REFINER || '').toLowerCase() === '1';

async function refineResponse({
  text,
  language,
  strategySeeds = null,
}) {
  if (!text || !text.trim()) {
    return {
      adjustedText: '',
      emotion: { label: 'unknown', confidence: 0 },
      meta: {
        status: 'skipped',
        reason: 'No text provided to Gemma refiner.',
      },
      memoryUpdates: [],
    };
  }

  const warnings = [];
  const prompt = buildPrompt({ text, language, strategySeeds });
  const fallbackText = text.trim();

  if (DISABLE_REFINER) {
    return {
      adjustedText: fallbackText,
      emotion: strategySeeds?.emotion || { label: 'unknown', confidence: 0 },
      memoryUpdates: [],
      meta: {
        status: 'disabled',
        reason: 'Gemma refinement disabled via DISABLE_GEMMA_REFINER flag.',
        warnings,
      },
    };
  }

  try {
    const rawText = await callGemmaModel(prompt);
    let parsed;
    try {
      parsed = safeParseJson(rawText);
    } catch (parseError) {
      warnings.push(parseError.message);
      return {
        adjustedText: fallbackText,
        emotion: strategySeeds?.emotion || { label: 'unknown', confidence: 0 },
        meta: {
          status: 'fallback',
          reason: 'Gemma response was not valid JSON.',
          raw: rawText,
          warnings,
        },
        memoryUpdates: [],
      };
    }

    const normalised = normaliseResult(parsed, fallbackText);

    return {
      adjustedText: normalised.adjustedText,
      emotion: normalised.emotion,
      memoryUpdates: normalised.memoryUpdates,
      meta: {
        status: 'success',
        language,
        model: DEFAULT_MODEL,
        warnings,
      },
    };
  } catch (error) {
    warnings.push(error.message);
    console.error('[gemmaClient] refinement failed:', error);
    return {
      adjustedText: fallbackText,
      emotion: strategySeeds?.emotion || { label: 'unknown', confidence: 0 },
      memoryUpdates: [],
      meta: {
        status: 'fallback',
        reason: 'Gemma refinement failed; using Gemini response as-is.',
        model: DEFAULT_MODEL,
        warnings,
      },
    };
  }
}

module.exports = {
  refineResponse,
};
