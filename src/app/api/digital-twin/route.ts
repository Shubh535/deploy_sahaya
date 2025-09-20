import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../utils/auth';
import { getDb } from '../../../firebase';

const COLLECTION = 'digital_twin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;
    const ref = getDb().collection(COLLECTION).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ mood: null, moodHistory: [], aiInsights: {} });
    }
    return NextResponse.json(snap.data());
  } catch (error: any) {
    console.error('Digital Twin GET error:', error);
    return NextResponse.json({ error: 'Failed to load digital twin' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const { mood } = await request.json();
    if (!mood) return NextResponse.json({ error: 'Missing mood' }, { status: 400 });

    const ref = getDb().collection(COLLECTION).doc(uid);
    const now = new Date().toISOString();
    const data = (await ref.get()).data() || { mood: null, moodHistory: [], aiInsights: {} };
    const updated = {
      ...data,
      mood,
      moodHistory: [...(data.moodHistory || []), { mood, timestamp: now }],
      updatedAt: now,
    };
    await ref.set(updated, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Digital Twin POST error:', error);
    return NextResponse.json({ error: 'Failed to update digital twin' }, { status: 500 });
  }
}
