import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB-DcIyCrM5tVMtW0vhGp21Kkf99Xc02LM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'femspen-bee68.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'femspen-bee68',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'femspen-bee68.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1089614326492',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1089614326492:web:1c3de3265648b4ffae6219',
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
// Export flag indicating firebase initialization status
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('placeholder')
);
