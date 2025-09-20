// Next.js compatible authentication middleware
import { NextRequest } from 'next/server';
import { getAdminAuth } from '../../firebase';

export async function authenticateUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decodedToken = await getAdminAuth().verifyIdToken(token);

    return {
      ...decodedToken,
      email: decodedToken.email
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return user;
}