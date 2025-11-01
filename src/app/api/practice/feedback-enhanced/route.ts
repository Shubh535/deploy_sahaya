// Next.js API Route: POST /api/practice/feedback-enhanced
// Proxies enhanced feedback requests to Express backend

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:4001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Practice feedback-enhanced API route called');
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Forward request to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/practice/feedback-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('Backend response received for feedback-enhanced');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Practice feedback-enhanced API error:', error);
    return NextResponse.json(
      { error: error.message || 'Enhanced feedback failed' },
      { status: 500 }
    );
  }
}
