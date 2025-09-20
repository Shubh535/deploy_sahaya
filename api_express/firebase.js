// Firebase Admin SDK setup for Firestore and Auth
const admin = require('firebase-admin');

// TODO: Replace with your Firebase project credentials
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://websahaya-3900d.firebaseio.com',
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
