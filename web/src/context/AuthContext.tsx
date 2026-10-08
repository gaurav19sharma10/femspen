import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getOrCreateUserProfile, discoverHouseholdForUser } from '../services/rvsRepo';
import type { UserProfile } from '../domain/types';

interface ExtendedUserProfile extends UserProfile {
  householdIds: string[];
  pinHash?: string;
  pinSalt?: string;
  pinEnabled?: boolean;
}

interface AuthContextType {
  user: { uid: string; email: string } | null;
  userProfile: ExtendedUserProfile | null;
  isAuthenticated: boolean;
  activeHouseholdId: string | null;
  setActiveHouseholdId: (hid: string) => void;
  isPinLocked: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockSession: () => void;
  sendResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.warn('🔑 AUTH USER:', firebaseUser.uid, firebaseUser.email);
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || '' });

        try {
          // Fetch or initialize profile
          const profile = await getOrCreateUserProfile(
            firebaseUser.uid,
            firebaseUser.email || '',
            firebaseUser.displayName || undefined
          );

          // Find active household
          let hid = profile.householdIds && profile.householdIds.length > 0 ? profile.householdIds[0] : null;

          if (!hid) {
            hid = await discoverHouseholdForUser(firebaseUser.uid);
          }

          setActiveHouseholdId(hid);
          setUserProfile(profile as ExtendedUserProfile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }

        // Realtime listener for user profile updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile((prev) => ({
              uid: firebaseUser.uid,
              displayName: data.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: data.email || firebaseUser.email || '',
              photoURL: data.photoURL || null,
              displayCurrency: data.displayCurrency || 'INR',
              defaultWeight: data.defaultWeight || 1,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              householdIds: Array.isArray(data.householdIds) ? data.householdIds : [],
              pinHash: data.pinHash,
              pinSalt: data.pinSalt,
              pinEnabled: Boolean(data.pinEnabled),
            }));

            if (Array.isArray(data.householdIds) && data.householdIds.length > 0 && !activeHouseholdId) {
              setActiveHouseholdId(data.householdIds[0]);
            }
          }
        });

        setLoading(false);
        return () => unsubProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveHouseholdId(null);
        setIsPinLocked(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Failed to sign in. Please check your email and password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Access temporarily restricted. Try again later.';
      }
      return { success: false, error: message };
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await getOrCreateUserProfile(res.user.uid, res.user.email || email);
      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);
      let message = 'Could not create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already in use. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose at least 6 characters.';
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setActiveHouseholdId(null);
    setIsPinLocked(false);
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    // If PIN is enabled in profile or local storage
    setIsPinLocked(false);
    return true;
  };

  const lockSession = () => {
    setIsPinLocked(true);
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not send reset link' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated: Boolean(user),
        activeHouseholdId,
        setActiveHouseholdId,
        isPinLocked,
        loading,
        loginWithEmail,
        signupWithEmail,
        logout,
        unlockWithPin,
        lockSession,
        sendResetEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
