import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/utils/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Prompt categories with CBT/DBT themes
const PROMPT_CATEGORIES = {
  gratitude: {
    name: "Gratitude",
    description: "Appreciate the positive aspects of life",
    system: "Generate a thoughtful gratitude journaling prompt that helps the user reflect on positive experiences, people they're thankful for, or moments of joy. Use CBT principles to reframe negative thinking patterns."
  },
  self_compassion: {
    name: "Self-Compassion",
    description: "Practice kindness toward yourself",
    system: "Generate a self-compassion journaling prompt based on Kristin Neff's self-compassion framework. Help the user treat themselves with kindness, recognize common humanity, and practice mindfulness about difficult emotions."
  },
  cognitive_reframing: {
    name: "Cognitive Reframing",
    description: "Challenge and reframe unhelpful thoughts",
    system: "Generate a CBT-based journaling prompt that helps identify cognitive distortions (all-or-nothing thinking, catastrophizing, mind reading, etc.) and guides the user to reframe thoughts more realistically and compassionately."
  },
  emotional_awareness: {
    name: "Emotional Awareness",
    description: "Understand and process your feelings",
    system: "Generate a DBT-inspired journaling prompt focusing on emotional awareness and validation. Help the user identify emotions, understand their triggers, and practice emotional regulation skills."
  },
  growth_mindset: {
    name: "Growth & Learning",
    description: "Reflect on personal development",
    system: "Generate a growth-mindset journaling prompt that encourages reflection on challenges as learning opportunities, celebrates progress over perfection, and focuses on effort and improvement."
  },
  stress_coping: {
    name: "Stress & Coping",
    description: "Process stress and build resilience",
    system: "Generate a journaling prompt that helps the user identify stressors, explore healthy coping strategies, and build resilience. Use CBT and DBT techniques for stress management."
  },
  relationship_reflection: {
    name: "Relationships",
    description: "Explore connections with others",
    system: "Generate a journaling prompt about relationships and interpersonal effectiveness. Help the user reflect on communication patterns, boundaries, and building meaningful connections using DBT DEAR MAN skills."
  },
  values_purpose: {
    name: "Values & Purpose",
    description: "Connect with what matters most",
    system: "Generate a journaling prompt that helps the user explore their core values, sense of purpose, and alignment between values and daily actions. Use Acceptance and Commitment Therapy (ACT) principles."
  }
};

/**
 * POST /api/manthan/reflection-prompts
 * Generate a personalized reflection prompt using Gemini AI
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const { category, mood, recentTopics } = await request.json();

    if (!category || !PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES]) {
      return NextResponse.json(
        { error: 'Invalid or missing category' },
        { status: 400 }
      );
    }

    const categoryConfig = PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES];

    // Build context from user's recent journaling patterns
    let contextInfo = "";
    if (mood) {
      contextInfo += `\nUser's current mood: ${mood}`;
    }
    if (recentTopics && recentTopics.length > 0) {
      contextInfo += `\nRecent journaling topics: ${recentTopics.join(", ")}`;
    }

    const systemPrompt = `${categoryConfig.system}

Guidelines:
1. Create ONE thoughtful, specific journaling prompt (not multiple questions)
2. Make it personal and relatable
3. Keep it 2-3 sentences maximum
4. Use compassionate, non-judgmental language
5. Make it open-ended to encourage deep reflection
6. Avoid clichés or generic advice
7. Tailor to the user's context if provided${contextInfo}

Return ONLY the prompt text, nothing else. No explanations, no labels, just the journaling prompt.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const promptText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!promptText) {
      throw new Error('No prompt generated');
    }

    // Clean up the prompt (remove quotes, extra whitespace)
    const cleanedPrompt = promptText.trim().replace(/^["']|["']$/g, '');

    return NextResponse.json({
      prompt: cleanedPrompt,
      category: category,
      categoryName: categoryConfig.name,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error generating reflection prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/manthan/reflection-prompts/categories
 * Get list of available prompt categories
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const categories = Object.entries(PROMPT_CATEGORIES).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
    }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
