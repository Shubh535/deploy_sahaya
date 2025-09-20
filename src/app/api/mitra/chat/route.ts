import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { chatWithGemini } from '../../../../gcloud';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const { message, mode = 'listener', language = 'en', history = [] } = await request.json();
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

    const result = await chatWithGemini({
      message,
      mode,
      language,
      history,
      userId: (authResult as any).uid,
    });

    return NextResponse.json({ aiResponse: { text: result.text }, mode: result.mode, language: result.language });
  } catch (error: any) {
    console.error('Mitra chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
