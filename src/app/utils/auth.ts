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
  // Dev bypass for testing
  if (process.env.DEV_BYPASS_AUTH === '1' || request.headers.get('x-dev-auth') === 'allow') {
    return { uid: 'dev-user', email: 'dev@example.com' };
  }

  const user = await authenticateUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return user;
}