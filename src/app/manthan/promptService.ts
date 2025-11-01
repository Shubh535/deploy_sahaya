import { getDb } from '@/firebase';

export interface ReflectionPrompt {
  id?: string;
  uid: string;
  prompt: string;
  category: string;
  categoryName: string;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
  journalId?: string; // Link to journal if user journaled from this prompt
}

/**
 * Save a generated prompt to Firestore
 */
export async function savePrompt(promptData: Omit<ReflectionPrompt, 'id' | 'createdAt'>): Promise<string> {
  try {
    const db = getDb();
    const docRef = await db.collection('manthan_prompts').add({
      ...promptData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving prompt:', error);
    throw new Error('Failed to save prompt');
  }
}

/**
 * Get all prompts for a user
 */
export async function getUserPrompts(
  uid: string,
  options: {
    limit?: number;
    category?: string;
    usedOnly?: boolean;
    unusedOnly?: boolean;
  } = {}
): Promise<ReflectionPrompt[]> {
  try {
    const db = getDb();
    const { limit = 50, category, usedOnly, unusedOnly } = options;

    let query = db.collection('manthan_prompts').where('uid', '==', uid);

    if (category) {
      query = query.where('category', '==', category);
    }

    if (usedOnly) {
      query = query.where('used', '==', true);
    } else if (unusedOnly) {
      query = query.where('used', '==', false);
    }

    // Fetch all and sort client-side to avoid composite index
    const snapshot = await query.get();
    const prompts: ReflectionPrompt[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      prompts.push({
        id: doc.id,
        uid: data.uid,
        prompt: data.prompt,
        category: data.category,
        categoryName: data.categoryName,
        used: data.used,
        usedAt: data.usedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        journalId: data.journalId,
      });
    });

    // Sort by createdAt descending (newest first)
    prompts.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });

    return prompts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching user prompts:', error);
    throw new Error('Failed to fetch prompts');
  }
}

/**
 * Mark a prompt as used when user journals from it
 */
export async function markPromptUsed(promptId: string, journalId?: string): Promise<void> {
  try {
    const db = getDb();
    const updateData: any = {
      used: true,
      usedAt: new Date(),
    };
    
    if (journalId) {
      updateData.journalId = journalId;
    }

    await db.collection('manthan_prompts').doc(promptId).update(updateData);
  } catch (error) {
    console.error('Error marking prompt as used:', error);
    throw new Error('Failed to update prompt');
  }
}

/**
 * Get a specific prompt by ID
 */
export async function getPrompt(promptId: string): Promise<ReflectionPrompt | null> {
  try {
    const db = getDb();
    const doc = await db.collection('manthan_prompts').doc(promptId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    return {
      id: doc.id,
      uid: data.uid,
      prompt: data.prompt,
      category: data.category,
      categoryName: data.categoryName,
      used: data.used,
      usedAt: data.usedAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      journalId: data.journalId,
    };
  } catch (error) {
    console.error('Error fetching prompt:', error);
    throw new Error('Failed to fetch prompt');
  }
}

/**
 * Delete a prompt
 */
export async function deletePrompt(promptId: string): Promise<void> {
  try {
    const db = getDb();
    await db.collection('manthan_prompts').doc(promptId).delete();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    throw new Error('Failed to delete prompt');
  }
}

/**
 * Get prompt usage statistics for a user
 */
export async function getPromptStats(uid: string): Promise<{
  totalGenerated: number;
  totalUsed: number;
  byCategory: { [key: string]: { generated: number; used: number } };
}> {
  try {
    const prompts = await getUserPrompts(uid, { limit: 1000 });
    
    const stats = {
      totalGenerated: prompts.length,
      totalUsed: prompts.filter(p => p.used).length,
      byCategory: {} as { [key: string]: { generated: number; used: number } },
    };

    prompts.forEach(prompt => {
      if (!stats.byCategory[prompt.category]) {
        stats.byCategory[prompt.category] = { generated: 0, used: 0 };
      }
      stats.byCategory[prompt.category].generated++;
      if (prompt.used) {
        stats.byCategory[prompt.category].used++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error calculating prompt stats:', error);
    throw new Error('Failed to calculate stats');
  }
}
