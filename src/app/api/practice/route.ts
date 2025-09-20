import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return available practice types
    const practices = [
      {
        id: 'mindfulness',
        name: 'Mindfulness Meditation',
        description: 'Focus on being present in the moment',
        duration: '10 minutes',
        category: 'meditation'
      },
      {
        id: 'breathing',
        name: 'Breathing Exercises',
        description: 'Simple breathing techniques for stress relief',
        duration: '5 minutes',
        category: 'breathing'
      },
      {
        id: 'gratitude',
        name: 'Gratitude Practice',
        description: 'Reflect on things you are grateful for',
        duration: '5 minutes',
        category: 'reflection'
      }
    ];

    return NextResponse.json({ practices });
  } catch (error: any) {
    console.error('Practice fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch practices' }, { status: 500 });
  }
}