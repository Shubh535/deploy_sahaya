// Firebase Admin SDK setup for Firestore and Auth (server-side)
import * as admin from 'firebase-admin';

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
}

const db = () => {
  ensureApp();
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
