# 💎 RVS Expences — Real-time Web Companion

<p align="center">
  <img src="public/logo.png" alt="RVS Expences Logo" width="100" height="100" style="border-radius: 24px;" />
</p>

<p align="center">
  <b>A tactile, Google Keep-inspired financial dashboard and companion web application for RVS Expences Android.</b><br />
  Synced with Google Cloud Firestore for zero-refresh real-time updates across mobile and web.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-purple?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFA611?style=flat-square&logo=firebase" alt="Firebase Firestore" />
  <img src="https://img.shields.io/badge/Motion-Framer_Motion-FF0055?style=flat-square&logo=framer" alt="Framer Motion" />
</p>

---

## 🎨 Visual Identity & Brand Styling

- **Primary Accent**: `#0057FF` (Electric Cobalt Blue)
- **Canvas / Chalk Background**: `#F8F7F4` (Tactile Matte Warm Canvas)
- **Google Keep Card Palette**:
  - ⚪ Default: `#FFFFFF`
  - 🍑 Coral Rose: `#FFCDD2`
  - 🍊 Soft Peach: `#FFE0B2`
  - 🍋 Pale Lemon: `#FFF9C4`
  - 🍃 Fresh Mint: `#C8E6C9`
  - 🌿 Muted Sage: `#DCEDC8`
  - 🌊 Sky Blue: `#BBDEFB`
  - 🌸 Soft Lavender: `#E1BEE7`

---

## ✨ Features & Architecture

### 1. 🔄 Real-time Firestore Engine (Zero-Refresh Sync)
- Direct cloud integration with Google Cloud Firestore (`expence-rvs`).
- Bidirectional live synchronization:
  - Add or edit an expense on the Android app → Appears on the Web Dashboard in milliseconds.
  - Quick-add or settle up on the Web Dashboard → Syncs instantly to the mobile app ledger.
- Strict schema parity with native Android app (`dateEpochDay`, `splitMode: EQUAL`, millisecond timestamps, clean splits map).

### 2. 📝 Google Keep UI & UX
- **Card Masonry Grid**: Multi-column fluid note feed with Keep pastel tints.
- **Top Quick-Add Bar**: Persistent expandable *"Take an expense note..."* bar with category chips, color picker, and pin toggle.
- **Pinned Notes Section**: Keep important dues and recurring bills pinned to the top.
- **Micro-Interactions**: Smooth spring physics powered by Framer Motion.

### 3. 👥 Family & Household Split Ledger
- Shared family ledger with real-time balance resolution.
- Intelligent split computation (Equal, Exact shares) verified against Firestore security rules.
- Family Pot contribution tracker & settlement history audit trail.

### 4. 🖋️ Hand-Crafted Optical 24×24 Vector SVGs
- 68+ authentic hand-crafted vector SVG icons matching the native Android mobile app icons (`basket`, `utensils`, `car`, `fuel`, `home`, `bolt`, `heart`, `book`, `bag`, `film`, `wallet`, etc.).
- Authentic vector empty-state artwork (`EmptyLedgerIllustration`, `AllSettledIllustration`, `EmptyInsightsIllustration`, `EmptyFamilyIllustration`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gaurav19sharma10/rvs-expences.git
   cd rvs-expences
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase project configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_web_app_id
   ```

4. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
├── public/
│   ├── logo.png               # Authentic RVS Expences App Logo
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication & Session Gate
│   │   ├── family/            # Family Member Management Modal
│   │   ├── feed/              # Keep Expense Cards, Masonry Grid, QuickAdd Bar
│   │   ├── sidebar/           # Live Insights, Balances & Settle Modal
│   │   └── vector/            # Hand-crafted 24x24 Vector SVGs & Illustrations
│   ├── context/
│   │   ├── AuthContext.tsx    # Firebase Auth & User Profile State
│   │   └── ExpenseContext.tsx # Real-time Firestore Listeners & State Machine
│   ├── domain/                # Financial calculations, currency & split algorithms
│   ├── lib/
│   │   └── firebase.ts        # Firebase Modular App & Firestore Initialization
│   ├── services/
│   │   └── rvsRepo.ts         # Direct Firestore Repositories matching Android rules
│   ├── App.tsx                # Main Application Shell
│   └── index.css              # Global styles & Tailwind CSS 4 directives
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Security & Firestore Rules

All data operations adhere to Cloud Firestore Security Rules:
- Document writes require membership check: `isMember(householdId)`.
- Members list query is strictly constrained to `where("inviteCode", "==", null)` ensuring security integrity.
- Splitting verification enforces `splitTotalMinor == baseAmountMinor` and `paidBy in participantIds`.

---

## 📄 License

This project is licensed under the MIT License.
