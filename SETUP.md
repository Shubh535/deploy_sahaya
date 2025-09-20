# Sahay Setup & Developer Guide

## Prerequisites
- Node.js 18+
- npm (or yarn/pnpm)
- Firebase project (Firestore, Auth enabled)
- Google Cloud project (Vertex AI, DLP, Fit/Health APIs if using those features)

## 1. Clone & Install
```bash
# Clone the repo
 git clone <your-repo-url>
 cd websahaya

# Install dependencies
 npm install
# or
yarn install
```

## 2. Environment Variables
Create a `.env.local` file in the root with your Firebase and API keys:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 3. Firebase Setup
- Enable **Authentication** (Email/Google) in Firebase Console.
- Enable **Firestore** (in test mode for dev, or set rules as below):

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /grove-trees/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
- Download your `serviceAccountKey.json` and place in `/api/` for backend use.

## 4. Google Cloud Setup
- Enable Vertex AI, DLP, and Fit/Health APIs as needed.
- Download and place your Vertex AI service account key as `vertexServiceAccount.json` in `/api/`.

## 5. Running the App
- Start the backend: (from `/api` folder)
  ```bash
  node index.js
  ```
- Start the frontend:
  ```bash
  npm run dev
  ```
- Visit [http://localhost:3000](http://localhost:3000)

## 6. Features Overview
- **Mitra**: Gemini-powered AI chatbot
- **Manthan**: AI journal, mood DNA, reframing, generative art
- **Dhwani**: Adaptive soundscapes, plants tree on play
- **Practice Space**: Roleplay/interview, plants tree on completion
- **Sanjha Grove**: Real-time healing garden, trees for positive actions
- **First-Aid Kit**: Calming modules, AR breathing, crisis button

## 7. Code Structure
- `/src/app/` — Next.js frontend (modular, per-feature folders)
- `/api/` — Node.js/Express backend (modular routes)
- `/src/app/components/` — Auth, UI wrappers
- `/src/app/utils/` — API/fetch helpers
- `/src/app/sanjha-grove/` — Real-time garden logic

## 8. Deployment
- Deploy frontend (Vercel, Netlify, etc.)
- Deploy backend (Render, Railway, GCP, etc.)
- Set environment variables in your deployment platform

## 9. Security & Production
- Harden Firestore rules for production
- Secure API keys and service accounts
- Monitor usage and billing on Firebase/GCP

## 10. Contributing
- Use clear code comments
- Keep features modular
- PRs welcome!

---
For questions, see code comments or open an issue.
