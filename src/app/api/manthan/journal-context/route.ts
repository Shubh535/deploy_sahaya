import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/utils/auth';
import { getUserJournals } from '@/app/manthan/journalService';

/**
 * GET /api/manthan/journal-context
 * Get journal context for Mitra conversations
 * Returns summarized journal history for AI context
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch recent journals
    const allJournals = await getUserJournals(uid, { limit: 100 });
    
    // Filter by date and limit
    const recentJournals = allJournals
      .filter(j => {
        const date = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
        return date >= startDate;
      })
      .slice(0, limit);

    // Format journals for Mitra context (summarized)
    const journalContext = recentJournals.map(j => {
      const date = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
      return {
        date: date.toISOString().split('T')[0],
        mood: j.mood,
        title: j.title || 'Untitled',
        summary: j.content.substring(0, 200) + (j.content.length > 200 ? '...' : ''),
        tags: j.tags || [],
        hasInsights: !!j.insights
      };
    });

    // Create a text summary for Mitra
    const contextText = journalContext.length > 0
      ? `User's Recent Journal History (last ${days} days):\n\n` +
        journalContext.map(j => 
          `${j.date} - ${j.mood} mood - ${j.title}\n${j.summary}${j.tags.length > 0 ? `\nTags: ${j.tags.join(', ')}` : ''}\n`
        ).join('\n')
      : 'User has no recent journal entries.';

    // Mood pattern analysis
    const moodCounts: { [key: string]: number } = {};
    journalContext.forEach(j => {
      moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    });
    
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    const moodPattern = journalContext.length > 0
      ? `Overall mood pattern: Mostly ${dominantMood} (${Math.round((moodCounts[dominantMood] / journalContext.length) * 100)}% of entries)`
      : '';

    return NextResponse.json({
      contextText,
      moodPattern,
      journalCount: journalContext.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      journals: journalContext
    });

  } catch (error: any) {
    console.error('Error fetching journal context:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch journal context' },
      { status: 500 }
    );
  }
}
