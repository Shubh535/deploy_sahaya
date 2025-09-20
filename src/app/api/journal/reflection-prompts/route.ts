import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const { type = 'daily' } = await request.json();

    // Try Gemini to generate context-aware prompts
    if (GEMINI_API_KEY) {
      try {
        const prompt = `Generate 5 concise, compassionate reflection prompts for a journaling session of type "${type}".
Return ONLY a JSON array of strings, no extra text.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let prompts: string[] = [];
        try { prompts = JSON.parse(text); } catch {}
        if (Array.isArray(prompts) && prompts.length) {
          return NextResponse.json({ prompts });
        }
      } catch (e) {
        console.warn('Gemini reflection-prompts failed, using fallback.', e);
      }
    }

    // Fallback prompts by type
    const fallback: Record<string, string[]> = {
      daily: [
        'What felt meaningful today?',
        'What challenged you and how did you respond?',
        'What is one small win you are grateful for?',
        'What did you learn about yourself today?',
        'What intention would you like to set for tomorrow?'
      ],
      emotional: [
        'Name three emotions you felt today and when you felt them.',
        'What sensation do you notice in your body right now?',
        'What helped you feel a little better today?',
        'What would support look like for you in this moment?',
        'If your feeling could speak, what would it say?'
      ],
      mindfulness: [
        'What can you see, hear, and feel around you right now?',
        'Where did your attention go today?',
        'What is one thing you can release this evening?',
        'What brought you a sense of calm or presence?',
        'What is one kind thing you can do for yourself tomorrow?'
      ],
      gratitude: [
        'List three small things you appreciate from today.',
        'Who supported you recently and how?',
        'What privilege or resource are you grateful for?',
        'What is something you often take for granted?',
        'How can you express gratitude to yourself?'
      ],
      growth: [
        'What skill are you developing and how did you practice it?',
        'What setback taught you something useful?',
        'What belief about yourself is changing?',
        'What is a small step toward a bigger goal?',
        'Who inspires you and why?'
      ],
    };
    const prompts = fallback[type] || fallback.daily;
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('reflection-prompts error:', error);
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
  }
}
