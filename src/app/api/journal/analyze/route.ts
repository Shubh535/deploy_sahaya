import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { anonymizeText, analyzeJournalEntry } from '../../../../gcloud';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const { entry } = await request.json();
    if (!entry) return NextResponse.json({ error: 'Missing entry' }, { status: 400 });

    const safe = await anonymizeText(entry);
    const ai = await analyzeJournalEntry({ entry: safe });
    return NextResponse.json(ai);
  } catch (error: any) {
    console.error('Journal analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze journal entry' }, { status: 500 });
  }
}
