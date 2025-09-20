import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { getDb } from '../../../../firebase';
import { analyzeMoodAI } from '../../../../gcloud';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;
    const ref = getDb().collection('digital_twin').doc(uid);
    const snap = await ref.get();
    const data = snap.data() || { mood: null, moodHistory: [], aiInsights: {} };

    const journalSnap = await getDb().collection('journals').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(10).get();
    const journalText = journalSnap.docs.map(d => d.data().content).join('\n\n');
    const healthSnap = await getDb().collection('health_data').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(10).get();
    const healthData = healthSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const aiInsights = await analyzeMoodAI({ journal: journalText, health: healthData, mood: data.mood });
    const updated = { ...data, aiInsights, updatedAt: new Date().toISOString() };
    await ref.set(updated, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Digital Twin analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze digital twin' }, { status: 500 });
  }
}
