/**
 * Manthan Journal Service
 * Handles all Firestore operations for journaling
 */

import { getDb } from '../../firebase';
import type { Timestamp } from 'firebase/firestore';

export interface JournalEntry {
  id?: string;
  uid: string;
  title: string;
  content: string;
  mood: 'happy' | 'sad' | 'anxious' | 'neutral' | 'excited' | 'angry';
  tags: string[];
  timestamp: Date | Timestamp;
  insights?: {
    cbt_analysis?: string;
    reframed_thought?: string;
    emotional_summary?: string;
    sentiment_score?: number; // -1 to 1
    key_patterns?: string[];
    cognitive_distortions?: string[];
  };
  wordCount?: number;
  encrypted?: boolean;
}

export interface UserMemorySummary {
  uid: string;
  recurring_emotions: string[];
  positive_trends: string[];
  growth_highlights: string[];
  triggers: string[];
  last_updated: Date | Timestamp;
}

const JOURNALS_COLLECTION = 'manthan_journals';
const MEMORIES_COLLECTION = 'user_memories';

/**
 * Save a new journal entry to Firestore
 */
export async function saveJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<string> {
  try {
    console.log('[saveJournalEntry] Attempting to get Firestore DB');
    const db = getDb();
    console.log('[saveJournalEntry] DB retrieved, adding document to collection:', JOURNALS_COLLECTION);
    
    const docRef = await db.collection(JOURNALS_COLLECTION).add({
      ...entry,
      timestamp: new Date(),
      wordCount: entry.content.split(/\s+/).length,
    });
    
    console.log('[saveJournalEntry] Document saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[saveJournalEntry] Error saving journal entry:', error);
    console.error('[saveJournalEntry] Error stack:', (error as Error).stack);
    throw new Error(`Failed to save journal entry: ${(error as Error).message}`);
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
  try {
    const db = getDb();
    await db.collection(JOURNALS_COLLECTION).doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw new Error('Failed to update journal entry');
  }
}

/**
 * Get all journal entries for a user
 */
export async function getUserJournals(
  uid: string,
  options?: {
    limit?: number;
    mood?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }
): Promise<JournalEntry[]> {
  try {
    const db = getDb();
    let query: any = db.collection(JOURNALS_COLLECTION).where('uid', '==', uid);

    // Removed orderBy to avoid composite index requirement
    // We'll sort in-memory instead
    
    if (options?.limit) {
      query = query.limit(options.limit * 2); // Get extra for client-side filtering
    }

    const snapshot = await query.get();
    let journals: JournalEntry[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      journals.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(data.timestamp),
      });
    });

    // Client-side filtering and sorting to avoid composite index
    if (options?.mood) {
      journals = journals.filter(j => j.mood === options.mood);
    }

    if (options?.startDate) {
      journals = journals.filter(j => {
        const timestamp = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
        return timestamp >= options.startDate!;
      });
    }

    if (options?.endDate) {
      journals = journals.filter(j => {
        const timestamp = j.timestamp instanceof Date ? j.timestamp : j.timestamp.toDate();
        return timestamp <= options.endDate!;
      });
    }

    // Filter by tags if specified (client-side filter since Firestore doesn't support array-contains-any with other filters)
    if (options?.tags && options.tags.length > 0) {
      journals = journals.filter(journal => 
        options.tags!.some(tag => journal.tags.includes(tag))
      );
    }

    // Sort by timestamp descending (newest first)
    journals.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toDate().getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toDate().getTime();
      return timeB - timeA;
    });

    // Apply limit after filtering and sorting
    if (options?.limit) {
      journals = journals.slice(0, options.limit);
    }

    return journals;
  } catch (error) {
    console.error('Error fetching user journals:', error);
    throw new Error('Failed to fetch journals');
  }
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  try {
    const db = getDb();
    const doc = await db.collection(JOURNALS_COLLECTION).doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data?.timestamp?.toDate() || new Date(data?.timestamp),
    } as JournalEntry;
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    throw new Error('Failed to fetch journal entry');
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    const db = getDb();
    await db.collection(JOURNALS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw new Error('Failed to delete journal entry');
  }
}

/**
 * Get user memory summary
 */
export async function getUserMemorySummary(uid: string): Promise<UserMemorySummary | null> {
  try {
    const db = getDb();
    const doc = await db.collection(MEMORIES_COLLECTION).doc(uid).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      ...data,
      last_updated: data?.last_updated?.toDate() || new Date(data?.last_updated),
    } as UserMemorySummary;
  } catch (error) {
    console.error('Error fetching user memory:', error);
    throw new Error('Failed to fetch user memory');
  }
}

/**
 * Update user memory summary
 */
export async function updateUserMemorySummary(uid: string, summary: Partial<UserMemorySummary>): Promise<void> {
  try {
    const db = getDb();
    await db.collection(MEMORIES_COLLECTION).doc(uid).set({
      uid,
      ...summary,
      last_updated: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user memory:', error);
    throw new Error('Failed to update user memory');
  }
}

/**
 * Search journals by text content
 */
export async function searchJournals(uid: string, searchText: string): Promise<JournalEntry[]> {
  try {
    const journals = await getUserJournals(uid);
    const lowerSearch = searchText.toLowerCase();
    
    return journals.filter(journal => 
      journal.title.toLowerCase().includes(lowerSearch) ||
      journal.content.toLowerCase().includes(lowerSearch) ||
      journal.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
    );
  } catch (error) {
    console.error('Error searching journals:', error);
    throw new Error('Failed to search journals');
  }
}

/**
 * Get mood statistics for a user
 */
export async function getMoodStatistics(uid: string, days: number = 30): Promise<Record<string, number>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const journals = await getUserJournals(uid, { startDate });
    
    const moodCounts: Record<string, number> = {};
    journals.forEach(journal => {
      moodCounts[journal.mood] = (moodCounts[journal.mood] || 0) + 1;
    });
    
    return moodCounts;
  } catch (error) {
    console.error('Error fetching mood statistics:', error);
    throw new Error('Failed to fetch mood statistics');
  }
}

/**
 * Get journaling streak (consecutive days)
 */
export async function getJournalingStreak(uid: string): Promise<number> {
  try {
    const journals = await getUserJournals(uid);
    
    if (journals.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user journaled today or yesterday
    const latestTimestamp = journals[0].timestamp;
    const latestDate = latestTimestamp instanceof Date 
      ? latestTimestamp 
      : latestTimestamp.toDate();
    latestDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      return 0; // Streak broken
    }
    
    // Count consecutive days
    for (let i = 1; i < journals.length; i++) {
      const prevTimestamp = journals[i - 1].timestamp;
      const currTimestamp = journals[i].timestamp;
      const prevDate = prevTimestamp instanceof Date 
        ? prevTimestamp 
        : prevTimestamp.toDate();
      const currDate = currTimestamp instanceof Date 
        ? currTimestamp 
        : currTimestamp.toDate();
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
