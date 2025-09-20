import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const { type = 'daily', responses = [], emotionalState } = await request.json();
    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'No responses provided' }, { status: 400 });
    }

    if (GEMINI_API_KEY) {
      try {
        const prompt = `You are a compassionate reflection companion. Given the journaling type "${type}", the user's responses, and their emotional state, generate 3-5 brief insights that are empathetic, actionable, and strength-based.
Return ONLY a JSON array of strings, no extra text.

Responses: ${JSON.stringify(responses)}
Emotional State: ${JSON.stringify(emotionalState)}`;

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
        let insights: string[] = [];
        try { insights = JSON.parse(text); } catch {}
        if (Array.isArray(insights) && insights.length) {
          return NextResponse.json({ insights });
        }
      } catch (e) {
        console.warn('Gemini insights failed, using fallback.', e);
      }
    }

    // Fallback insights
    const fallback = [
      'You showed awareness of your feelings—acknowledge that progress.',
      'Consider a small, doable step aligned with your needs tomorrow.',
      'Reframe a challenging thought into a kinder, more helpful one.',
      'Reach out to a supportive person or resource if needed.',
      'Close the day with one gratitude to reinforce positive attention.'
    ];
    return NextResponse.json({ insights: fallback });
  } catch (error) {
    console.error('insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
