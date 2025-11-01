import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/apiClient';
import { MoodState } from './useAdaptiveSoundscape';

interface JournalInsight {
  primaryEmotion: string;
  emotionIntensity: number;
  sentiment: string;
  topThemes: string[];
  stressLevel: string;
  energyLevel: string;
  clarity: string;
  recommendations: string[];
}

interface UseManthanInsightsReturn {
  insights: JournalInsight | null;
  loading: boolean;
  error: string | null;
  mood: MoodState | null;
  refresh: () => Promise<void>;
}

// Map journal emotions to soundscape moods
function mapEmotionToMood(emotion: string, energyLevel: string, stressLevel: string): MoodState {
  const emotionLower = emotion.toLowerCase();

  // High stress conditions
  if (stressLevel === 'high' || emotionLower.includes('anxious') || emotionLower.includes('worried')) {
    return 'anxious';
  }

  // Stressed conditions
  if (stressLevel === 'moderate' || emotionLower.includes('stressed') || emotionLower.includes('overwhelmed')) {
    return 'stressed';
  }

  // Sad/low energy conditions
  if (emotionLower.includes('sad') || emotionLower.includes('down') || emotionLower.includes('lonely')) {
    return 'sad';
  }

  // Calm/peaceful conditions
  if (emotionLower.includes('calm') || emotionLower.includes('peaceful') || emotionLower.includes('content')) {
    return 'peaceful';
  }

  // Energetic conditions
  if (energyLevel === 'high' || emotionLower.includes('excited') || emotionLower.includes('happy') || emotionLower.includes('energetic')) {
    return 'energetic';
  }

  // Calm default
  if (emotionLower.includes('relaxed') || stressLevel === 'low') {
    return 'calm';
  }

  // Default to neutral
  return 'neutral';
}

export function useManthanInsights(): UseManthanInsightsReturn {
  const [insights, setInsights] = useState<JournalInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodState | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching Manthan journals...');
      
      // Fetch recent Manthan journal entries (NOT reflection_sessions)
      const journalsResponse = await apiRequest('/manthan/journals?limit=10', {
        method: 'GET',
      });

      console.log('Manthan journals received:', journalsResponse);

      if (!journalsResponse.journals || journalsResponse.journals.length === 0) {
        console.log('No Manthan journal entries found');
        setInsights(null);
        setMood(null);
        setLoading(false);
        return;
      }

      // Aggregate moods from recent journals
      const recentJournals = journalsResponse.journals.slice(0, 5); // Last 5 journals
      const moods = recentJournals
        .map((j: any) => j.mood) // Manthan has 'mood' field directly
        .filter(Boolean);

      console.log('Recent Manthan moods:', moods);

      // Calculate aggregated insights
      if (moods.length > 0) {
        // Manthan moods: 'happy' | 'sad' | 'anxious' | 'neutral' | 'excited' | 'angry'
        // Count mood occurrences
        const moodCounts = moods.reduce((acc: any, m: string) => {
          acc[m] = (acc[m] || 0) + 1;
          return acc;
        }, {});
        
        // Find most common mood
        const primaryMood = Object.entries(moodCounts)
          .sort(([, a]: any, [, b]: any) => b - a)[0][0] as string;

        // Calculate stress level based on mood distribution
        const stressEmotions = ['anxious', 'angry', 'sad'];
        const stressCount = moods.filter((m: string) => stressEmotions.includes(m)).length;
        const stressLevel = stressCount > moods.length * 0.5 ? 'high' :
                           stressCount > moods.length * 0.3 ? 'moderate' : 'low';

        // Calculate energy level based on mood
        const energeticMoods = ['excited', 'happy'];
        const energyCount = moods.filter((m: string) => energeticMoods.includes(m)).length;
        const energyLevel = energyCount > moods.length * 0.5 ? 'high' :
                           energyCount > moods.length * 0.3 ? 'medium' : 'low';

        // Get sentiment from recent journals
        const recentSentiments = recentJournals
          .map((j: any) => j.insights?.sentiment_score || 0)
          .filter((s: number) => s !== 0);
        const avgSentiment = recentSentiments.length > 0
          ? recentSentiments.reduce((a: number, b: number) => a + b, 0) / recentSentiments.length
          : 0;
        const sentiment = avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral';

        const aggregatedInsights: JournalInsight = {
          primaryEmotion: primaryMood,
          emotionIntensity: Math.abs(avgSentiment),
          sentiment,
          topThemes: [],
          stressLevel,
          energyLevel,
          clarity: Math.abs(avgSentiment) > 0.7 ? 'high' : Math.abs(avgSentiment) > 0.4 ? 'medium' : 'low',
          recommendations: [
            `Your recent journals show ${primaryMood} mood`,
            `Stress level appears ${stressLevel}`,
            `Consider activities that align with your ${energyLevel} energy`,
          ],
        };

        setInsights(aggregatedInsights);

        // Map the primary mood to a soundscape mood state
        const detectedMood = mapEmotionToMood(
          primaryMood,
          energyLevel,
          stressLevel
        );

        setMood(detectedMood);
        console.log(`📊 Manthan Mood Analysis:`);
        console.log(`  • Raw moods from journals: [${moods.join(', ')}]`);
        console.log(`  • Most common: "${primaryMood}"`);
        console.log(`  • Mapped to soundscape: "${detectedMood}"`);
        console.log(`  • Stress: ${stressLevel}, Energy: ${energyLevel}`);
      } else {
        // Journals exist but no mood data
        setInsights(null);
        setMood(null);
        console.log('Journals found but no mood data');
      }
    } catch (err) {
      console.error('Failed to fetch Manthan insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      setInsights(null);
      setMood(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch insights on mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    error,
    mood,
    refresh: fetchInsights,
  };
}
