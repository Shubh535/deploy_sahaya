import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { getDb } from '../../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const { id, type, prompts, responses, insights, emotionalState, createdAt, completedAt } = await request.json();
    if (!id || !type || !responses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const sessionData = {
      id,
      userId: (auth as any).uid,
      type,
      prompts,
      responses,
      insights: insights || [],
      emotionalState,
      createdAt: new Date(createdAt),
      completedAt: completedAt ? new Date(completedAt) : null,
      updatedAt: new Date(),
    };

    // Skip saving to Firestore in dev mode if Firebase isn't initialized
    if (process.env.DEV_BYPASS_AUTH === '1') {
      console.log('Dev mode: Skipping Firestore save, session data:', sessionData);
      return NextResponse.json({ success: true, sessionId: id, devMode: true });
    }

    await getDb().collection('reflection_sessions').doc(id).set(sessionData);
    return NextResponse.json({ success: true, sessionId: id });
  } catch (error: any) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const snapshot = await getDb()
      .collection('reflection_sessions')
      .where('userId', '==', (auth as any).uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
