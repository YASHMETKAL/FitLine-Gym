# FitLine-Gym

A full-featured fitness web application combining personalized workout recommendations, real-time progress tracking, and an AI coach.

**Tech Stack:** React 18 · TypeScript · Vite · Firebase · Tailwind CSS · shadcn-ui

---

## Features

- **Authentication** — Email/Password and Google OAuth with persistent sessions
- **Profile Setup** — Multi-step onboarding wizard (name, metrics, goals, experience)
- **Dashboard** — Weekly progress, daily workout recommendation, motivational quotes
- **Workout Library** — 9 routines across 4 intensity levels: Quickie, Classic, Power, Beast
- **Workout Session** — Live timer, exercise guidance, animated visuals, video modal
- **AI Coach** — Floating chat interface with local fallback (no external API required)
- **Progress Tracking** — Firestore-backed real-time completion tracking
- **Profile Page** — Nutrition plans, stats, and settings

---

## Prerequisites

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org/)
- **Firebase account** → [firebase.google.com](https://firebase.google.com/)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Sign-in method → turn on **Email/Password** and **Google**
3. Create a **Firestore Database** (start in test mode)
4. Go to **Project Settings → General → Your apps** → register a web app and copy the config

### 3. Create `.env.local`

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: external AI endpoint
# VITE_AI_ENDPOINT=https://your-ai-api.com/chat
```

### 4. Run the dev server

```bash
npm run dev
```

App starts at **http://localhost:5173**

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check code for errors |

---

## Project Structure

```
src/
├── App.tsx                  # Main router (protected + public routes)
├── pages/
│   ├── Landing.tsx          # Public marketing page
│   ├── Auth.tsx             # Login / sign-up
│   ├── Setup.tsx            # Profile onboarding wizard
│   ├── Dashboard.tsx        # Main hub
│   ├── DailyWorkout.tsx     # Workout selection
│   ├── WorkoutSession.tsx   # Active session with timer
│   └── Profile.tsx          # Settings & metrics
├── components/
│   ├── AICoach.tsx          # Floating chat interface
│   ├── AnimatedExercise.tsx # Exercise visual animations
│   ├── ExerciseVideoModal.tsx
│   └── ui/                  # 30+ shadcn-ui components
├── contexts/
│   └── AuthContext.tsx      # Global auth state (user, profile, logout)
├── lib/
│   ├── firebase.ts          # Firebase initialization
│   ├── workouts.ts          # Workout data & logic
│   ├── ai.ts                # AI coach logic
│   ├── mockData.ts
│   ├── pdfGenerator.ts
│   └── utils.ts
└── hooks/
    ├── use-toast.ts
    └── use-mobile.tsx
```

---

## Architecture

```
Browser
└── React App (Vite + TypeScript)
    ├── AuthContext  ──→  Firebase Auth
    ├── Pages / Components
    └── Firestore reads/writes
            ├── users/{uid}               # Profile & settings
            ├── users/{uid}/completions/  # Workout history
            └── users/{uid}/progress/     # Stats & analytics
```

---

## Deploying to Vercel

1. Push your code to GitHub and import the repo in [Vercel](https://vercel.com/)
2. Add all `VITE_FIREBASE_*` environment variables in **Vercel → Settings → Environment Variables**
3. In Firebase Console → **Authentication → Settings → Authorized domains**, add your Vercel domain (e.g. `your-app.vercel.app`)
4. Deploy — Google Sign-In will now work on the live URL

---

## Troubleshooting

**`operation-not-allowed` on sign-in** — Enable Email/Password and Google in Firebase Authentication → Sign-in method.

**`auth/unauthorized-domain` on Vercel** — Add your Vercel domain to Firebase → Authentication → Settings → Authorized domains.

**Firebase writes failing** — Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```
Or paste these rules manually in Firebase Console → Firestore → Rules:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /completions/{completionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Module not found / install errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
lsof -ti:5173 | xargs kill -9
```
