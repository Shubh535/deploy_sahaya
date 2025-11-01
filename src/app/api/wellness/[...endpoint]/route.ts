// Next.js API Route: /api/wellness/*
// Unified proxy for all wellness endpoints (breathing, affirmations, sessions)

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:4001';

// Helper function to proxy requests
async function proxyToBackend(endpoint: string, request: NextRequest, method: string = 'POST') {
  try {
    const authHeader = request.headers.get('authorization');
    
    let options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
    };

    if (method === 'POST') {
      const body = await request.json();
      options.body = JSON.stringify(body);
    }

    console.log(`Wellness API: ${method} ${endpoint}`);

    const backendResponse = await fetch(`${BACKEND_URL}/api/wellness/${endpoint}`, options);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error for ${endpoint}:`, backendResponse.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Wellness API error for ${endpoint}:`, error);
    return NextResponse.json(
      { error: error.message || `Request failed for ${endpoint}` },
      { status: 500 }
    );
  }
}

// POST /api/wellness/narration
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Extract endpoint from path
  if (pathname.includes('/narration')) {
    return proxyToBackend('narration', request, 'POST');
  }
  else if (pathname.includes('/breathing-session')) {
    return proxyToBackend('breathing-session', request, 'POST');
  }
  else if (pathname.includes('/affirmations') && !pathname.includes('daily')) {
    return proxyToBackend('affirmations', request, 'POST');
  }
  else if (pathname.includes('/save-affirmation')) {
    return proxyToBackend('save-affirmation', request, 'POST');
  }
  else if (pathname.includes('/set-reminder')) {
    return proxyToBackend('set-reminder', request, 'POST');
  }
  else if (pathname.includes('/text-to-speech')) {
    return proxyToBackend('text-to-speech', request, 'POST');
  }
  else if (pathname.includes('/generate-session')) {
    return proxyToBackend('generate-session', request, 'POST');
  }
  else if (pathname.includes('/complete-session')) {
    return proxyToBackend('complete-session', request, 'POST');
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// GET endpoints
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.includes('/daily-affirmation')) {
    return proxyToBackend('daily-affirmation', request, 'GET');
  }
  else if (pathname.includes('/saved-affirmations')) {
    return proxyToBackend('saved-affirmations', request, 'GET');
  }
  else if (pathname.includes('/progress')) {
    return proxyToBackend('progress', request, 'GET');
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}
