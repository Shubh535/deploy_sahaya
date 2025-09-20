import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { getDb } from '../../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const { content, encrypted = false } = await request.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const data = {
      userId: (authResult as any).uid,
      content,
      encrypted,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const doc = await getDb().collection('journals').add(data);
    return NextResponse.json({ success: true, id: doc.id });
  } catch (error: any) {
    console.error('Journal save error:', error);
    return NextResponse.json({ error: 'Failed to save journal' }, { status: 500 });
  }
}
