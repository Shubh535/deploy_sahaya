import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../utils/auth';
import { chatWithGemini } from '../../../gcloud';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function svgPlaceholder(prompt: string) {
  const hash = [...prompt].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const hue = hash % 360;
  const hue2 = (hue + 60) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='320'>
  <defs>
    <linearGradient id='g' x1='0' x2='1'>
      <stop offset='0%' stop-color='hsl(${hue},70%,70%)'/>
      <stop offset='100%' stop-color='hsl(${hue2},70%,70%)'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='rgba(0,0,0,0.5)' font-family='sans-serif' font-size='18'>Mood Art</text>
  </svg>`;
  return Buffer.from(svg).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';
    const body = (await request.json().catch(() => ({}))) || {};

    switch (action) {
      case 'imagen-generate': {
        // Placeholder image generation (no external billing). Returns base64 SVG.
        const prompt: string = body.prompt || 'Abstract calming art';
        const imageBase64 = svgPlaceholder(prompt);
        return json({ imageBase64 });
      }
      case 'practice-simulate': {
        const { scenario, userInput = '', history = [] } = body;
        if (GEMINI_API_KEY) {
          try {
            const system = `You are a compassionate roleplay simulator for communication practice. Be concise, kind, and offer one actionable tip.`;
            const historyText = history.map((h: any) => `User: ${h.user}\nAI: ${h.ai}`).join('\n');
            const prompt = `${system}\nScenario: ${scenario}\nHistory:\n${historyText}\nUser: ${userInput}\nAI:`;
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
            );
            const data = await res.json();
            const ai = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const feedback = 'Nice effort. Try acknowledging feelings, stating needs clearly, and proposing a small next step.';
            return json({ ai, feedback });
          } catch (e) {
            // fallthrough to local
          }
        }
        const ai = `Thanks for sharing. Consider acknowledging your feelings, stating your needs clearly, and proposing a small next step.`;
        const feedback = 'Great effort! You used clear language. Add a positive affirmation and a concrete next step.';
        return json({ ai, feedback });
      }
      case 'soundscape-recommend': {
        const recommendations = [
          { id: 'nature-sounds', name: 'Nature Sounds', description: 'Gentle forest and water sounds for relaxation', duration: '30 minutes', category: 'nature' },
          { id: 'meditation-bells', name: 'Meditation Bells', description: 'Soft bell tones for mindfulness practice', duration: '20 minutes', category: 'meditation' },
          { id: 'ocean-waves', name: 'Ocean Waves', description: 'Calming ocean wave sounds', duration: '45 minutes', category: 'nature' },
        ];
        return json({ message: 'Soundscape recommendations generated successfully', recommendations });
      }
      case 'chat-message': {
        const { message, mode = 'listener', language = 'en', history = [] } = body;
        if (!message) return json({ error: 'Missing message' }, 400);
        const result = await chatWithGemini({ message, mode, language, history, userId: (auth as any).uid });
        return json(result);
      }
      case 'mitra-test': {
        const { message, emotionalIntensity = 0 } = body;
        if (!message) return json({ error: 'Message is required.' }, 400);
        let enhanced = message;
        if (emotionalIntensity > 5) enhanced = `[High intensity ${emotionalIntensity}/10] ${message}`;
        else if (emotionalIntensity > 2) enhanced = `[Moderate intensity ${emotionalIntensity}/10] ${message}`;
        const aiResponse = await chatWithGemini({ message: enhanced, mode: 'listener', language: 'en', history: [], userId: (auth as any).uid });
        return json({ aiResponse, status: 'success', emotionalIntensity });
      }
      default:
        return json({ error: 'Unknown action' }, 404);
    }
  } catch (error) {
    console.error('Unified route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
