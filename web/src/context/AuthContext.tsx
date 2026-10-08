import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { generateSalt, hashString, verifyHash } from '../lib/crypto';
import { UserProfile, ExpenseMode } from '../types';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isPinLocked: boolean;
  isPinConfigured: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupPinAndSecurity: (pin: string, question: string, answer: string) => Promise<boolean>;
  resetPinWithSecurityAnswer: (answer: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  lockSession: () => void;
  updateCurrency: (currency: string) => Promise<void>;
  updateMonthlyBudget: (mode: ExpenseMode, amount: number) => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'EXPENSE_TRACKER_LOCAL_PROFILE';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setUser({ uid: parsed.uid || 'demo-user', email: parsed.email || 'demo@femspen.app' });
          setUserProfile(parsed);
          setIsPinLocked(true);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || '' });
        
        if (db) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubDoc = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setUserProfile(data);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          }, (err) => {
            console.error('Firestore user profile snapshot error:', err);
            setLoading(false);
          });
          return () => unsubDoc();
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isPinConfigured = Boolean(userProfile?.pinHash && userProfile?.pinSalt && userProfile?.securityAnswerHash);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      const dummyUid = 'user-' + email.replace(/[^a-zA-Z0-9]/g, '_');
      const newUser = { uid: dummyUid, email };
      setUser(newUser);
      
      const localProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (localProfile) {
        const parsed = JSON.parse(localProfile);
        setUserProfile(parsed);
      }
      setIsPinLocked(true);
      return { success: true };
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsPinLocked(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      const dummyUid = 'user-' + email.replace(/[^a-zA-Z0-9]/g, '_');
      const newUser = { uid: dummyUid, email };
      setUser(newUser);
      setUserProfile(null);
      setIsPinLocked(true);
      return { success: true };
    }

    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setIsPinLocked(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create account' };
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
    setIsPinLocked(true);
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    if (!userProfile?.pinHash || !userProfile?.pinSalt) return false;
    const isValid = await verifyHash(pin, userProfile.pinSalt, userProfile.pinHash);
    if (isValid) {
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const setupPinAndSecurity = async (pin: string, question: string, answer: string): Promise<boolean> => {
    if (!user) return false;

    const pinSalt = generateSalt();
    const pinHash = await hashString(pin, pinSalt);

    const answerSalt = generateSalt();
    const securityAnswerHash = await hashString(answer, answerSalt);

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      pinHash,
      pinSalt,
      securityQuestion: question,
      securityAnswerHash: `${securityAnswerHash}:${answerSalt}`,
      currency: 'USD',
      monthlyBudget: {
        individual: 1500,
        family: 4500,
      },
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (err) {
        console.error('Error saving profile to Firestore:', err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    setUserProfile(newProfile);
    setIsPinLocked(false);
    return true;
  };

  const resetPinWithSecurityAnswer = async (answer: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile || !userProfile.securityAnswerHash) {
      return { success: false, error: 'No security question configured.' };
    }

    const [expectedHash, salt] = userProfile.securityAnswerHash.split(':');
    const isAnswerValid = await verifyHash(answer, salt, expectedHash);

    if (!isAnswerValid) {
      return { success: false, error: 'Incorrect security answer. Please try again.' };
    }

    const newSalt = generateSalt();
    const newPinHash = await hashString(newPin, newSalt);

    const updatedProfile: UserProfile = {
      ...userProfile,
      pinHash: newPinHash,
      pinSalt: newSalt,
    };

    if (isFirebaseConfigured && db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updatedProfile);
      } catch (err) {
        console.error('Error updating profile in Firestore:', err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
    setIsPinLocked(false);
    return { success: true };
  };

  const lockSession = () => {
    setIsPinLocked(true);
  };

  const updateCurrency = async (newCurrency: string) => {
    if (!userProfile) return;
    const updated = { ...userProfile, currency: newCurrency };
    setUserProfile(updated);
    if (isFirebaseConfigured && db && user) {
      await setDoc(doc(db, 'users', user.uid), updated);
    }
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
  };

  const updateMonthlyBudget = async (mode: ExpenseMode, amount: number) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      monthlyBudget: {
        ...userProfile.monthlyBudget,
        [mode]: amount,
      },
    };
    setUserProfile(updated);
    if (isFirebaseConfigured && db && user) {
      await setDoc(doc(db, 'users', user.uid), updated);
    }
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
  };

  const enableDemoMode = async () => {
    const demoUser = { uid: 'demo-user-keep', email: 'demo@femspen.app' };
    const salt = generateSalt();
    const pinHash = await hashString('1234', salt);
    const ansSalt = generateSalt();
    const ansHash = await hashString('Blue', ansSalt);

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      email: demoUser.email,
      pinHash,
      pinSalt: salt,
      securityQuestion: 'What is your favorite color?',
      securityAnswerHash: `${ansHash}:${ansSalt}`,
      currency: 'USD',
      monthlyBudget: {
        individual: 1200,
        family: 3800,
      },
      createdAt: Date.now(),
    };

    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(demoProfile));
    setUser(demoUser);
    setUserProfile(demoProfile);
    setIsPinLocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated: !!user,
        isPinLocked,
        isPinConfigured,
        loading,
        loginWithEmail,
        signupWithEmail,
        logout,
        unlockWithPin,
        setupPinAndSecurity,
        resetPinWithSecurityAnswer,
        lockSession,
        updateCurrency,
        updateMonthlyBudget,
        enableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
