import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'FEMSPEN_PROFILE';

const formatFirebaseError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please verify your details or register a new account.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase Console. Please enable it under Authentication > Sign-in method.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few moments before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    let unsubDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        const currentUser = { uid: firebaseUser.uid, email: firebaseUser.email || '' };
        setUser(currentUser);

        // Instant local cache restoration
        const cachedStr = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY}_${firebaseUser.uid}`);
        let hasCachedProfile = false;
        if (cachedStr) {
          try {
            const cachedProfile = JSON.parse(cachedStr);
            setUserProfile(cachedProfile);
            hasCachedProfile = true;
          } catch {
            // ignore
          }
        }

        // Live real-time Firestore sync
        if (db) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          unsubDoc = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as UserProfile;
                setUserProfile(data);
                localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${firebaseUser.uid}`, JSON.stringify(data));
              } else if (!hasCachedProfile) {
                setUserProfile(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn('Firestore profile listener notice:', err.message);
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsPinLocked(true);
        setLoading(false);
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubscribeAuth();
    };
  }, []);

  const isPinConfigured = Boolean(
    userProfile?.pinHash && userProfile?.pinSalt && userProfile?.securityAnswerHash
  );

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsPinLocked(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatFirebaseError(err) };
    }
  };

  const signupWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
      setIsPinLocked(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatFirebaseError(err) };
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
    const securityAnswerHash = await hashString(answer.trim().toLowerCase(), answerSalt);

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

    // Save locally first so user is immediately unblocked
    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${user.uid}`, JSON.stringify(newProfile));
    setUserProfile(newProfile);
    setIsPinLocked(false);

    // Save to Firestore in real-time
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (err: any) {
        console.warn('Note: Profile saved locally. Firestore cloud sync notice:', err.message);
      }
    }

    return true;
  };

  const resetPinWithSecurityAnswer = async (answer: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile || !userProfile.securityAnswerHash) {
      return { success: false, error: 'No security question configured.' };
    }

    const [expectedHash, salt] = userProfile.securityAnswerHash.split(':');
    const isAnswerValid = await verifyHash(answer.trim().toLowerCase(), salt, expectedHash);

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

    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userProfile.uid}`, JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
    setIsPinLocked(false);

    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updatedProfile);
      } catch (err: any) {
        console.warn('Note: PIN updated locally. Firestore sync notice:', err.message);
      }
    }

    return { success: true };
  };

  const lockSession = () => {
    setIsPinLocked(true);
  };

  const updateCurrency = async (newCurrency: string) => {
    if (!userProfile) return;
    const updated = { ...userProfile, currency: newCurrency };
    setUserProfile(updated);
    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userProfile.uid}`, JSON.stringify(updated));

    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated);
      } catch (err) {
        console.warn('Firestore currency sync error:', err);
      }
    }
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
    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userProfile.uid}`, JSON.stringify(updated));

    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated);
      } catch (err) {
        console.warn('Firestore budget sync error:', err);
      }
    }
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
