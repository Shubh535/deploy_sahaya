// Free Gemini API setup (no billing required)
const API_KEY = process.env.GEMINI_API_KEY; // Get from Google AI Studio

// Google Cloud DLP setup (for data anonymization)
// Configure credentials for serverless environments like Vercel.
import { DlpServiceClient } from '@google-cloud/dlp';
const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

let dlp: DlpServiceClient | null = null;
let dlpSoftDisabled = false;
let dlpWarningLogged = false;

try {
  // Support both GOOGLE_APPLICATION_CREDENTIALS (path) and GOOGLE_APPLICATION_CREDENTIALS_JSON (inline JSON)
  const inlineCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const clientOptions: Record<string, any> = {};
  if (inlineCreds) {
    clientOptions.credentials = JSON.parse(inlineCreds);
    clientOptions.projectId = gcpProject;
  }
  dlp = new DlpServiceClient(clientOptions as any);
} catch (e) {
  console.warn('DLP client init failed or missing credentials. Falling back to basic redaction.', e);
  dlpSoftDisabled = true;
}

const BASIC_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: '[EMAIL_ADDRESS]' },
  { regex: /(?:\+?\d{1,3}[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]?\d{3}[\s-]?\d{4}/g, replacement: '[PHONE_NUMBER]' },
  { regex: /\b([A-Z][a-z]+\s){1,3}[A-Z][a-z]+\b/g, replacement: '[PERSON_NAME]' },
];

function basicRedact(text: string) {
  return BASIC_PATTERNS.reduce((acc, pattern) => acc.replace(pattern.regex, pattern.replacement), text);
}

function shouldSkipDlp() {
  if (!dlp || dlpSoftDisabled) return true;
  if (!gcpProject) {
    if (!dlpWarningLogged) {
      console.warn('No GOOGLE_CLOUD_PROJECT/FIREBASE_PROJECT_ID found. Skipping DLP anonymization.');
      dlpWarningLogged = true;
    }
    return true;
  }
  return false;
}

export async function anonymizeText(text: string): Promise<string> {
  if (!text || !text.trim()) return text;

  if (shouldSkipDlp()) {
    return basicRedact(text);
  }

  try {
    const parent = dlp!.projectPath(gcpProject!);
    const request = {
      parent,
      item: { value: text },
      deidentifyConfig: {
        infoTypeTransformations: {
          transformations: [
            {
              infoTypes: [
                { name: 'EMAIL_ADDRESS' },
                { name: 'PHONE_NUMBER' },
                { name: 'PERSON_NAME' },
              ],
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

    const [response] = await dlp!.deidentifyContent(request as any);
    const value = (response as any)?.item?.value as string | undefined;
    return value ?? text;
  } catch (error: any) {
    const message = error?.message || '';
    const code = error?.code || error?.details || '';
    const combined = `${code} ${message}`.trim();
    if (!dlpWarningLogged) {
      console.warn('DLP anonymization unavailable. Falling back to basic redaction.', combined || error);
      dlpWarningLogged = true;
    }

    if (/SERVICE_DISABLED|PERMISSION_DENIED|PROJECT\s+\d+\s+does\s+not\s+exist/i.test(combined)) {
      dlpSoftDisabled = true;
    }

    return basicRedact(text);
  }
}

// NLP-powered reframing for journal entries (CBT/DBT)
export async function analyzeJournalEntry({ entry, language = 'en' }: { entry: string; language?: string }) {
  const prompt = `You are a compassionate mental health assistant trained in CBT and DBT. Given the following journal entry, analyze the sentiment and provide a reframing suggestion using evidence-based techniques.\n\nJournal Entry:\n${entry}\n\nRespond with a JSON object with keys: sentiment, reframing.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
    let aiResult: any = {};
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
      error: (error as Error).message,
    };
  }
}

export async function chatWithGemini({ message, mode = 'listener', language = 'en', history = [], userId }: {
  message: string;
  mode?: string;
  language?: string;
  history?: any[];
  userId: string;
}) {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
    return { text: 'AI chat failed. Please try again later.', error: (error as Error).message, language, mode };
  }
}

export async function analyzeMoodAI({ journal, health, mood }: { journal: string; health: any; mood: string }) {
  // Compose prompt for Gemini
  const prompt = `You are an empathetic mental wellness assistant. Analyze the following user data and provide a summary of their emotional state, mood trends, and any helpful insights or suggestions.\n\nRecent Journal Entries:\n${journal}\n\nHealth Data:\n${JSON.stringify(health)}\n\nCurrent Mood: ${mood || 'Not set'}\n\nRespond with a JSON object with keys: summary, moodTrends, suggestions.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
    let aiInsights: any = {};
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
      error: (error as Error).message,
    };
  }
}