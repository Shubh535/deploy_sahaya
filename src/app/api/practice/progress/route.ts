// Next.js API Route: GET/POST /api/practice/progress
// Proxies progress tracking to Express backend

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    console.log('Practice progress GET API route called');
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Forward request to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/practice/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
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
    console.log('Backend progress data received');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Practice progress GET API error:', error);
    return NextResponse.json(
      { error: error.message || 'Progress fetch failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Practice progress POST API route called');
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Forward request to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/practice/progress`, {
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
    console.log('Backend progress save successful');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Practice progress POST API error:', error);
    return NextResponse.json(
      { error: error.message || 'Progress save failed' },
      { status: 500 }
    );
  }
}
