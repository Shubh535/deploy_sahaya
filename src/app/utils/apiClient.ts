// API client for authenticated requests
import { getIdToken } from './getIdToken';

// Backend URL for Express API (Mitra chat, etc.)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Routes that should go to Express backend
// NOTE: /api/manthan stays on Next.js (not in this list)
const BACKEND_ROUTES = ['/api/mitra/chat', '/api/journal'];

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await getIdToken();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  // Construct API path
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  
  // Determine if this route should go to backend or stay on frontend
  const shouldUseBackend = BACKEND_ROUTES.some(route => apiPath.startsWith(route));
  const url = shouldUseBackend && BACKEND_URL ? `${BACKEND_URL}${apiPath}` : apiPath;
  
  console.log(`apiRequest: calling ${url}`);
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
