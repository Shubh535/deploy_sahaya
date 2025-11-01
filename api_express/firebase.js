// Firebase Admin SDK setup for Firestore and Auth
const admin = require('firebase-admin');
const path = require('path');

// Load service account from environment variable or local file
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Resolve relative paths from project root
  const credPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('Loading service account from:', credPath);
  serviceAccount = require(credPath);
} else {
  console.log('Loading service account from local file');
  serviceAccount = require('./serviceAccountKey.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://websahaya-3900d.firebaseio.com',
  });
  console.log('Firebase Admin initialized successfully');
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
