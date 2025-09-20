import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { anonymizeText, analyzeJournalEntry } from '../../../../gcloud';
import { getDb } from '../../../../firebase';

export async function POST(request: NextRequest) {
  // Combined handler:
  // - if body has `entry`, perform analyze
  // - if body has `content`, perform save
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const uid = (authResult as any).uid;

    const body = await request.json();
    if (body?.entry) {
      const safe = await anonymizeText(body.entry as string);
      const ai = await analyzeJournalEntry({ entry: safe });
      return NextResponse.json(ai);
    }

    if (body?.content) {
      const { content, encrypted = false } = body as { content: string; encrypted?: boolean };
      const data = {
        userId: uid,
        content,
        encrypted,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const doc = await getDb().collection('journals').add(data);
      return NextResponse.json({ success: true, id: doc.id });
    }

    return NextResponse.json({ error: 'Missing entry or content' }, { status: 400 });
  } catch (error: any) {
    console.error('Journal route error:', error);
    return NextResponse.json({ error: 'Journal operation failed' }, { status: 500 });
  }
}
