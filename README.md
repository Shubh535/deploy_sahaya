yarn dev

# Sahay (सहाय) – AI-Powered Mental Wellness Platform

>Sahay is a proactive, predictive, and evolving mental wellness co-pilot for students. Its core innovation is an Emotional Digital Twin—an adaptive AI profile that learns from your mind (journals), body (biometrics), and behavior to provide personalized support.

---

## 🌱 Features

- **Mitra**: Free Gemini API-powered AI chatbot (empathetic, multilingual, mode-switching)
- **Manthan**: AI journal with mood DNA, reframing, and generative art
- **Dhwani**: Adaptive soundscapes for relaxation/focus, plants a tree on play
- **Practice Space**: Roleplay/interview, plants a tree on completion
- **Sanjha Grove**: Real-time healing garden, trees for positive actions
- **First-Aid Kit**: Calming modules, AR breathing, crisis button
- **Emotional Digital Twin**: Tracks mood, nudges, and AI insights

## 🚀 Quickstart

1. **Clone & Install**
	 ```bash
	 git clone <your-repo-url>
	 cd websahaya
	 npm install
	 # or yarn install
	 ```
2. **Configure**
	 - Copy `.env.example` to `.env` and fill in your API keys:
	   - Get free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
	   - Configure Firebase project credentials
	 - See [SETUP.md](./SETUP.md) for full details
3. **Run**
	 - Start backend: `node api/index.js`
	 - Start frontend: `npm run dev`
	 - Visit [http://localhost:3000](http://localhost:3000)

## 🚀 AI Integration

**Free Gemini API** (No billing required!)
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Set `GEMINI_API_KEY=your-key-here` in your `.env` file
- Supports all AI features: chat, journal analysis, mood insights

## 🏗️ Project Structure

- `/src/app/` — Next.js frontend (modular, per-feature folders)
- `/api/` — Node.js/Express backend (modular routes)
- `/src/app/components/` — Auth, UI wrappers, theme toggle
- `/src/app/utils/` — API/fetch helpers
- `/src/app/sanjha-grove/` — Real-time garden logic

## 🔒 Security

- Firestore rules restrict `grove-trees` to authenticated users:
	```
	service cloud.firestore {
		match /databases/{database}/documents {
			match /grove-trees/{docId} {
				allow read, write: if request.auth != null;
			}
		}
	}
	```
- Secure your API/service account keys (never commit secrets)

## 🧩 Integrations

- **Firebase**: Auth, Firestore (real-time garden, journals)
- **Google Cloud**: Vertex AI (Gemini, Imagen 2), DLP, Fit/Health (optional)

## 📝 Contributing

- Keep features modular and well-commented
- PRs and feedback welcome!

## 📄 More

- See [SETUP.md](./SETUP.md) for full setup, deployment, and developer notes
- For questions, see code comments or open an issue
