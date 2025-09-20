// API client for authenticated requests to backend
import { getIdToken } from './getIdToken';

const BASE_URL = ''; // Use relative URLs for Next.js API routes

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await getIdToken();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // For Next.js API routes, use relative paths
  const url = path.startsWith('/api') ? path : `/api${path}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
