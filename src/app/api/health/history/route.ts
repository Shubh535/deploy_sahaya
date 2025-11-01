// Next.js API route for /api/health/history
// Proxies GET requests to backend Express server

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-406762118051.asia-south1.run.app';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    
    const response = await fetch(`${BACKEND_URL}/api/health/history?days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying health history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
