import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
    return NextResponse.json({ success: true, uid: decoded.uid, decoded });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}