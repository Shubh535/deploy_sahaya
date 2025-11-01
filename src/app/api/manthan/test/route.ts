import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/manthan/test
 * Simple test endpoint to verify API is working
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Manthan API is working',
    timestamp: new Date().toISOString(),
    env: {
      devBypass: process.env.DEV_BYPASS_AUTH,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

/**
 * POST /api/manthan/test
 * Echo back the request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      status: 'ok',
      message: 'Received your data',
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: (error as Error).message
    }, { status: 400 });
  }
}
