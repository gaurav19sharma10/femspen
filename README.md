# Google Keep Expense Tracker (Web & Native Android)

A full-featured personal and family expense management application inspired by the clean, tactile user experience of **Google Keep**. Built with **Native Android (Kotlin + Jetpack Compose)**, a **Modern Web App (React + Vite + Tailwind + Framer Motion)**, and powered by **Google Cloud Firestore** for instantaneous, zero-refresh real-time synchronization.

---

## 🎨 Visual Identity & Colors
- **Primary Cobalt Accent**: `HEX: #0057FF`
- **Surface & Background Chalk**: `HEX: #F8F7F4`
- **Google Keep Pastel Palette**:
  - Soft Peach: `#FFE0B2`
  - Fresh Mint: `#C8E6C9`
  - Sky Blue: `#BBDEFB`
  - Pale Lemon: `#FFF9C4`
  - Soft Lavender: `#E1BEE7`
  - Coral Rose: `#FFCDD2`
  - Muted Sage: `#DCEDC8`

---

## 🌟 Key Features

1. **Dual Ledger Modes (Individual & Family)**:
   - Instant single-account profile toggle between **Individual** (personal budget) and **Family** (household shared expenses).
   - In Family mode, assign expenses to members (e.g., *Dad, Mom, Kids, Shared Household*).

2. **Google Keep UI/UX**:
   - **Date-Grouped Feed**: Automatic sections for *Today*, *Yesterday*, *Earlier This Week*, and *This Month* with total spend counters in each header.
   - **Pinned Notes**: Pin recurring bills or critical dues to the top of your ledger.
   - **Keep Pastel Tinting**: Color-code expense cards with Keep's palette.
   - **Fluid Animations**: Bouncy spring transitions powered by Framer Motion.
   - **Handcrafted Vector Art**: Custom SVG illustrations for vault security, empty states, and family mode.

3. **2FA PIN & Hardware Biometric Security**:
   - Mandatory **4-digit PIN** lock protecting financial data across both platforms.
   - **Android Hardware Biometrics**: Unlock instantly via Fingerprint or Face ID (`AndroidX BiometricPrompt`).
   - **Security Question Recovery**: If you forget your PIN, answer your secret recovery question to safely reset it.
   - **Cryptographic Protection**: PINs and answers are salted and hashed with SHA-256 via the Web Crypto API on Web and Android Keystore/Security Crypto.

4. **Real-time Firestore Sync Engine**:
   - Updates made on Web or Android propagate instantly via Firestore snapshot listeners without needing a page refresh.

5. **🎯 Goals — Family & Individual Savings System**:
   - **Individual Goals**: Personal saving targets with manual top-ups, daily/monthly automated schedules, and round-ups.
   - **Group Family Goals**: Shared saving targets among selected family members with real-time contribution tracking and leaderboards.
   - **Unanimous Spending Approval**: Withdrawing or spending from a group goal requires unanimous consent from all participating members.
   - **Round-Up Savings**: Automatically rounds up expenses to the nearest ₹10 or ₹100 and sweeps spare change into active goals.

6. **💳 Family & Individual Wallet System**:
   - **Audited Financial Ledger**: Dual-mode ledger tracking every top-up, transfer, expense deduction, adjustment, and reversal.
   - **Family Head Permissions**: Add funds, transfer money atomically to any family member, review and approve/reject money requests with urgency tags.
   - **Spending Controls & Safeguards**: Set daily/monthly member spending limits, freeze/unfreeze wallets, and enforce negative balance policies (`Block`, `Allow with Limit`, `Unlimited`).
   - **Automated Allowances**: Schedule recurring daily, weekly, or monthly allowances for family members.
   - **Seamless Expense Integration**: Expenses are automatically debited from the active wallet with reversal protection on deletion.

7. **Financial Analytics & Tools**:
   - Category distribution visual donut/bar breakdowns.
   - Monthly budget cap progress bars with overspend alerts.
   - Recurring subscriptions & upcoming bill manager.
   - Multi-currency support (USD `$`, INR `₹`, EUR `€`, GBP `£`, JPY `¥`, etc.).
   - One-click export to CSV and JSON.

---

## 🚀 Quick Start Guide

### 1. Web Application (`web/`)

The web app includes an **Instant Demo Mode** so you can test the entire experience immediately without entering Firebase credentials.

```bash
# Navigate to web directory
cd web

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.
- Click **"Launch Instant Demo"** to explore immediately with pre-loaded Google Keep sample cards (Default PIN: `1234`).
- Or click **"Create Account"** to test the 2FA PIN and security question onboarding flow!

---

### 2. Native Android Application (`android/`)

The Android application is written in **Kotlin** with **Jetpack Compose**, **Material 3**, and **AndroidX Biometrics**.

```bash
# Open in Android Studio
1. Launch Android Studio.
2. Select "Open" and navigate to:
   C:\Users\dell\.gemini\antigravity\scratch\expense-tracker\android
3. Sync Gradle and run on an Android Device or Emulator (API 26+).
```

- When prompted for Biometric authentication, you can use your device's fingerprint sensor or test with PIN `1234`.

---

## 🔥 Step-by-Step Firebase Project Setup

Follow these steps to enable live, real-time cloud synchronization across devices:

### Step 1: Create a Project in Firebase Console
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**, enter a name (e.g. `keep-expense-tracker`), and click **Continue**.
3. (Optional) Disable Google Analytics or enable it, then click **Create Project**.

### Step 2: Enable Firebase Authentication
1. In the Firebase Console left menu, navigate to **Build** > **Authentication**.
2. Click **"Get started"**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the **Email/Password** switch and click **Save**.

### Step 3: Create Cloud Firestore Database
1. In the left menu, navigate to **Build** > **Firestore Database**.
2. Click **"Create database"**.
3. Select your preferred database location (e.g. `nam5 (us-central)` or `asia-south1`).
4. Select **Start in test mode** (or production mode) and click **Create**.
5. Go to the **Rules** tab and paste these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access and modify their own financial records
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```
Click **Publish**.

---

### Step 4: Configure Web Client
1. In Firebase Console, click the **Settings gear icon (⚙️)** > **Project settings**.
2. Under **Your apps**, click the **Web icon (`</>`)**.
3. Enter app nickname `Keep Expenses Web` and click **Register app**.
4. Copy the `firebaseConfig` credentials.
5. In `expense-tracker/web/`, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
6. Paste your keys:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
   ```
*(Alternatively, you can paste the JSON directly into the in-app Settings modal!)*

---

### Step 5: Configure Android Client
1. In Firebase Console **Project settings**, click **"Add app"** > **Android icon**.
2. Set the Android package name to:
   ```
   com.expensetracker
   ```
3. Set the App nickname to `Expense Tracker Android`.
4. Click **Register app**.
5. Download `google-services.json`.
6. Move the downloaded `google-services.json` file into:
   ```
   expense-tracker/android/app/google-services.json
   ```

---

## 🔒 Security & Data Architecture

```
/users/{userId}
   ├── uid: string
   ├── email: string
   ├── pinHash: string               // SHA-256(PIN + salt)
   ├── pinSalt: string               // 16-byte random salt
   ├── securityQuestion: string      // Recovery question
   ├── securityAnswerHash: string    // SHA-256(Answer + salt)
   ├── currency: string              // E.g. "USD", "INR"
   └── monthlyBudget: { individual, family }
   └── /expenses/{expenseId}
         ├── title: string
         ├── amount: number
         ├── category: string        // "Food", "Transport", etc.
         ├── mode: string            // "individual" | "family"
         ├── color: string           // Keep pastel hex code
         ├── isPinned: boolean
         ├── date: string            // "YYYY-MM-DD"
         ├── notes: string
         ├── familyMember: string?   // When in family mode
         ├── isRecurring: boolean
         └── createdAt: timestamp
```

---

## 🛠️ Tech Stack Summary

| Layer | Web Application | Android Application |
|---|---|---|
| **Language** | TypeScript | Kotlin |
| **UI Framework** | React 19 + Tailwind CSS | Jetpack Compose + Material 3 |
| **Motion & FX** | Framer Motion | Compose Animation & Transitions |
| **Icons & Art** | Lucide Icons + Handcrafted SVG | Material Icons Extended + VectorDrawables |
| **Security** | Web Crypto API (SHA-256 + Salt) | AndroidX BiometricPrompt + Keystore Crypto |
| **Cloud Database** | Firebase Firestore (Realtime `onSnapshot`) | Firebase Firestore Android SDK (`Flow`) |
