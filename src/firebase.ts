// Firebase Admin SDK setup for Firestore and Auth (server-side)
import * as admin from 'firebase-admin';

// Read credentials from environment variables to work on Vercel (no JSON files)
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Support escaped newlines in env var
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebase-admin] Missing FIREBASE_* env vars. Admin SDK will not be initialized.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
}

const db = () => {
  if (!admin.apps.length) throw new Error('Firebase admin not initialized: missing credentials');
  return admin.firestore();
};

const adminAuth = () => {
  if (!admin.apps.length) throw new Error('Firebase admin not initialized: missing credentials');
  return admin.auth();
};

// Export helpers to access initialized services lazily
export const getDb = db;
export const getAdminAuth = adminAuth;
