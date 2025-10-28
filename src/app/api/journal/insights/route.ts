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

    console.log('Insights API called with:', { type, responses, emotionalState });
    console.log('GEMINI_API_KEY present:', !!GEMINI_API_KEY);

    if (GEMINI_API_KEY) {
      console.log('Gemini API key found, attempting to call Gemini...');
      try {
        const prompt = `You are a compassionate reflection companion. Given the journaling type "${type}", the user's responses, and their emotional state, generate 3-5 brief insights that are empathetic, actionable, and strength-based.
Return ONLY a JSON array of strings, no extra text.

Responses: ${JSON.stringify(responses)}
Emotional State: ${JSON.stringify(emotionalState)}`;

        console.log('Making Gemini API call...');
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        console.log('Gemini API response status:', res.status);
        const data = await res.json();
        console.log('Gemini API response data:', JSON.stringify(data, null, 2));

        // Check for quota/rate limit errors
        if (res.status === 429 || data?.error?.code === 429) {
          console.log('Gemini API quota exceeded, using fallback insights');
          // Skip to fallback insights
        } else if (!res.ok) {
          console.log('Gemini API error:', res.status, data?.error?.message || 'Unknown error');
          // Skip to fallback insights
        } else {
          // Process successful response
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('Extracted text from Gemini:', text);
          let insights: string[] = [];

          // Strip markdown code block syntax if present
          let cleanText = text.trim();
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          console.log('Cleaned text for parsing:', cleanText);

          try {
            insights = JSON.parse(cleanText);
            console.log('Successfully parsed insights:', insights);
          } catch (parseError) {
            console.log('Failed to parse Gemini response as JSON:', parseError);
            console.log('Raw text that failed to parse:', text);
            console.log('Cleaned text that failed to parse:', cleanText);
          }
          console.log('Parsed insights array:', insights);
          if (Array.isArray(insights) && insights.length) {
            console.log('Successfully generated insights from Gemini:', insights);
              return NextResponse.json({ insights }, { headers: { 'x-ai-source': 'gemini' } });
          }
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
      return NextResponse.json({ insights: fallback }, { headers: { 'x-ai-source': 'fallback' } });
  } catch (error) {
    console.error('insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
