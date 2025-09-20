import { NextRequest, NextResponse } from 'next/server';
import { chatWithGemini } from '../../../../gcloud';

export async function POST(request: NextRequest) {
  try {
    const { message, emotionalIntensity = 0 } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Enhance the message with emotional context if intensity is detected
    let enhancedMessage = message;
    if (emotionalIntensity > 5) {
      enhancedMessage = `[User is experiencing high emotional intensity (${emotionalIntensity}/10). Respond with extra compassion and care.] ${message}`;
    } else if (emotionalIntensity > 2) {
      enhancedMessage = `[User is experiencing moderate emotional intensity (${emotionalIntensity}/10). Be attentive to their needs.] ${message}`;
    }

    const aiResponse = await chatWithGemini({
      message: enhancedMessage,
      mode: 'listener',
      language: 'en',
      history: [],
      userId: 'test-user',
    });

    return NextResponse.json({ aiResponse, status: 'success', emotionalIntensity });
  } catch (error: any) {
    console.error('POST /api/mitra/test error:', error);
    return NextResponse.json({ error: 'Chat failed', details: error.message }, { status: 500 });
  }
}