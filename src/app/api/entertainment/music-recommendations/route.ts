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

    // Forward request to Express backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    
    const response = await fetch(`${backendUrl}/api/entertainment/music-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Music recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music recommendations', details: error.message },
      { status: 500 }
    );
  }
}
