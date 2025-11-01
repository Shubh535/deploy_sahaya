import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/utils/auth';
import { getMoodStatistics, getJournalingStreak, getUserJournals } from '@/app/manthan/journalService';

/**
 * GET /api/grove/analytics
 * Get comprehensive analytics for Sanjha Grove visualization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Fetch all journals for the user
    const allJournals = await getUserJournals(uid, { limit: 1000 });

    // Filter journals by time range
    const journalsInRange = allJournals.filter(j => {
      const journalDate = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
      return journalDate >= startDate && journalDate <= endDate;
    });

    // Calculate mood statistics
    const moodStats = await getMoodStatistics(uid, parseInt(timeRange));

    // Calculate journaling streak
    const streak = await getJournalingStreak(uid);

    // Calculate total trees (all time)
    const totalTrees = allJournals.length;

    // Calculate active days in current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activeDaysThisMonth = new Set(
      allJournals
        .filter(j => {
          const date = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .map(j => {
          const date = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
          return date.toDateString();
        })
    ).size;

    // Find dominant mood
    let dominantMood = 'neutral';
    let maxCount = 0;
    Object.entries(moodStats).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood;
      }
    });

    // Create mood timeline data (last 30 days)
    const timeline: { date: string; mood: string; count: number; avgSentiment?: number }[] = [];
    const last30Days = 30;
    
    for (let i = last30Days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const journalsOnDay = journalsInRange.filter(j => {
        const jDate = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
        return jDate.toISOString().split('T')[0] === dateStr;
      });

      if (journalsOnDay.length > 0) {
        // Find most common mood that day
        const moodCounts: { [key: string]: number } = {};
        journalsOnDay.forEach(j => {
          moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
        });
        
        const dayMood = Object.entries(moodCounts).reduce((a, b) => 
          b[1] > a[1] ? b : a
        )[0];

        timeline.push({
          date: dateStr,
          mood: dayMood,
          count: journalsOnDay.length,
        });
      }
    }

    // Pattern insights
    const insights = [];

    // Most active day of week
    const dayOfWeekCounts: { [key: string]: number } = {};
    journalsInRange.forEach(j => {
      const date = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
    });

    if (Object.keys(dayOfWeekCounts).length > 0) {
      const mostActiveDay = Object.entries(dayOfWeekCounts).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];
      insights.push(`You journal most on ${mostActiveDay}s`);
    }

    // Streak encouragement
    if (streak > 0) {
      if (streak >= 7) {
        insights.push(`🔥 Amazing! ${streak}-day streak! Keep the momentum going!`);
      } else if (streak >= 3) {
        insights.push(`🌱 ${streak}-day streak! You're building a great habit!`);
      } else {
        insights.push(`✨ ${streak}-day streak! Every day counts!`);
      }
    } else {
      insights.push(`🌟 Start your journaling journey today!`);
    }

    // Most common mood
    if (maxCount > 0) {
      const moodEmojis: { [key: string]: string } = {
        happy: '😊',
        calm: '😌',
        neutral: '😐',
        anxious: '😰',
        sad: '😢',
        angry: '😡',
      };
      insights.push(`${moodEmojis[dominantMood] || '💭'} ${dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1)} is your most common mood this period`);
    }

    // Mood distribution for pie chart
    const moodDistribution = Object.entries(moodStats).map(([mood, count]) => ({
      mood,
      count,
      percentage: totalTrees > 0 ? Math.round((count / totalTrees) * 100) : 0,
    }));

    return NextResponse.json({
      overview: {
        totalTrees,
        currentStreak: streak,
        activeDaysThisMonth,
        dominantMood,
      },
      moodStats,
      moodDistribution,
      timeline,
      insights,
      timeRange: parseInt(timeRange),
    });

  } catch (error: any) {
    console.error('Error fetching grove analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
