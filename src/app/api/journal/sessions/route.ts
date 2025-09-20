import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { getDb } from '../../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const user = authResult;
    const { id, type, prompts, responses, insights, emotionalState, createdAt, completedAt } = await request.json();

    if (!id || !type || !responses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sessionData = {
      id,
      userId: user.uid,
      type,
      prompts,
      responses,
      insights: insights || [],
      emotionalState,
      createdAt: new Date(createdAt),
      completedAt: completedAt ? new Date(completedAt) : null,
      updatedAt: new Date()
    };

    // Save to Firestore
  await getDb().collection('reflection_sessions').doc(id).set(sessionData);

    return NextResponse.json({ success: true, sessionId: id });
  } catch (error: any) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const user = authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

  const sessionsRef = getDb().collection('reflection_sessions')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await sessionsRef.get();
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}