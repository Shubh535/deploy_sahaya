// Firebase Admin SDK setup for Firestore and Auth (server-side)
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

let initialized = false;

function ensureApp() {
  if (initialized && admin.apps.length) return;

  // Prefer full JSON if provided
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (json) {
    try {
      const creds = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      initialized = true;
      return;
    } catch (e) {
      console.warn('[firebase-admin] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    }
  }

  // Fallback to discrete FIREBASE_* vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // Handle common formatting issues
  // - Replace literal \n with real newlines
  // - Trim surrounding quotes if present
  privateKey = privateKey.replace(/\\n/g, '\n').trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  if (projectId && clientEmail && privateKey) {
    // Skip Firebase initialization in dev mode if credentials are placeholders
    if (process.env.DEV_BYPASS_AUTH === '1' && privateKey.includes('your_private_key')) {
      console.log('[firebase-admin] Skipping Firebase initialization in dev mode with placeholder credentials');
      return;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      initialized = true;
      return;
    } catch (e) {
      console.warn('[firebase-admin] Failed to initialize with FIREBASE_* vars:', e);
    }
  }

  // If we reach here, we intentionally do NOT throw during import/build.
  // Actual getters will throw when used without valid credentials.

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const candidatePaths = [
    serviceAccountPath,
    'api_express/serviceAccountKey.json',
    'serviceAccountKey.json',
  ].filter((p): p is string => !!p);

  for (const candidate of candidatePaths) {
    const resolvedCandidate = resolve(process.cwd(), candidate);
    if (!existsSync(resolvedCandidate)) continue;
    try {
      const creds = JSON.parse(readFileSync(resolvedCandidate, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      initialized = true;
      return;
    } catch (e) {
      console.warn(
        '[firebase-admin] Failed to initialize with service account file at %s:',
        resolvedCandidate,
        e,
      );
    }
  }
}

const db = () => {
  ensureApp();
  
  // In dev mode with bypass, return a mock or throw a more helpful error
  if (process.env.DEV_BYPASS_AUTH === '1' && !admin.apps.length) {
    console.warn('[firebase-admin] DEV_BYPASS_AUTH is enabled but Firebase not initialized');
    console.warn('[firebase-admin] Using serviceAccountKey.json for initialization');
    
    // Try one more time with service account file
    try {
      const { readFileSync } = require('fs');
      const { resolve } = require('path');
      const serviceAccountPath = resolve(process.cwd(), 'src/serviceAccountKey.json');
      const creds = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      console.log('[firebase-admin] Successfully initialized with service account file');
      return admin.firestore();
    } catch (e) {
      console.error('[firebase-admin] Failed to initialize:', e);
      throw new Error('Firebase admin not initialized: missing credentials');
    }
  }
  
  if (!admin.apps.length) throw new Error('Firebase admin not initialized: missing credentials');
  return admin.firestore();
};

const adminAuth = () => {
  ensureApp();
  if (!admin.apps.length) throw new Error('Firebase admin not initialized: missing credentials');
  return admin.auth();
};

// Export helpers to access initialized services lazily
export const getDb = db;
export const getAdminAuth = adminAuth;
