import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { chatWithGemini } from '../../../../gcloud';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response if auth failed
    }

    const user = authResult;
    const { message, mode = 'listener', language = 'en', history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const result = await chatWithGemini({
      message,
      mode,
      language,
      history,
      userId: user.uid
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}