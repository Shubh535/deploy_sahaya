import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * POST /api/manthan/analyze
 * Analyze journal entry using Gemini for CBT-based insights
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const { content, mood } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const prompt = `You are a compassionate mental health assistant trained in Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT).

Analyze this journal entry and provide insights:

Journal Entry:
${content}

Current Mood: ${mood || 'unknown'}

Provide a JSON response with:
{
  "cognitive_distortions": ["list of detected cognitive distortions with brief explanations"],
  "reframed_thought": "A balanced, CBT-reframed perspective in 2-3 sentences",
  "emotional_summary": "Empathetic summary of the emotional state in 2-3 sentences",
  "sentiment_score": <number between -1 (very negative) and 1 (very positive)>,
  "key_patterns": ["notable patterns or themes"],
  "encouragement": "Brief encouraging message"
}

Be compassionate, non-judgmental, and supportive.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON from the response
    let insights: any = {};
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON response:', parseError);
      // Fallback: return raw text
      insights = {
        emotional_summary: text,
        reframed_thought: 'Analysis complete. Please review the full response.',
        sentiment_score: 0,
        cognitive_distortions: [],
        key_patterns: [],
        encouragement: 'Keep reflecting on your thoughts and feelings.',
      };
    }

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    console.error('Error analyzing journal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze journal' },
      { status: 500 }
    );
  }
}
