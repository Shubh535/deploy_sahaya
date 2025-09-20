import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../utils/auth';
import { getDb } from '../../../firebase';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const user = authResult;
    const healthData = await request.json();

    const dataToSave = {
      ...healthData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
  const docRef = await getDb().collection('health_data').add(dataToSave);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Health data saved successfully'
    });
  } catch (error: any) {
    console.error('Health data save error:', error);
    return NextResponse.json({ error: 'Failed to save health data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const user = authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

  const snapshot = await getDb().collection('health_data')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const healthData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ healthData });
  } catch (error: any) {
    console.error('Health data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}