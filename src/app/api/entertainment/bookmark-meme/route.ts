import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('@/serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { memeId, bookmarked } = body;

    // Forward request to Express backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    
    const response = await fetch(`${backendUrl}/entertainment/bookmark-meme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, memeId, bookmarked }),
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Bookmark meme API error:', error);
    return NextResponse.json(
      { error: 'Failed to save bookmark', details: error.message },
      { status: 500 }
    );
  }
}
