import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

  const auth = getAdminAuth();
  const userRecord = await auth.createUser({ email, password });
    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}