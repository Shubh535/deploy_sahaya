// Next.js API Route: POST /api/practice/simulate
// Proxies practice simulation requests to Express backend

import { NextRequest, NextResponse } from 'next/server';

// Use environment variable or fallback to localhost
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:4001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Practice simulate API route called');
    console.log('Request body:', body);
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Forward request to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/practice/simulate`, {
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
    console.log('Backend response received, AI length:', data.ai?.length, 'Feedback length:', data.feedback?.length);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Practice simulate API error:', error);
    return NextResponse.json(
      { error: error.message || 'Practice simulation failed' },
      { status: 500 }
    );
  }
}
