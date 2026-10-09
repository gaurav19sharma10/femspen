import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { generateSalt, hashString, verifyHash } from '../lib/crypto';
import { UserProfile, ExpenseMode, Gender, FamilyGroup, FamilyMember } from '../types';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  userProfile: UserProfile | null;
  family: FamilyGroup | null;
  isAuthenticated: boolean;
  isPinLocked: boolean;
  isPinConfigured: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (
    email: string,
    pass: string,
    extraData?: {
      displayName?: string;
      dob?: string;
      gender?: Gender;
      phoneNumber?: string;
      photoUrl?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupPinAndSecurity: (pin: string, question: string, answer: string) => Promise<boolean>;
  resetPinWithSecurityAnswer: (answer: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  lockSession: () => void;
  updateCurrency: (currency: string) => Promise<void>;
  updateMonthlyBudget: (mode: ExpenseMode, amount: number) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createFamily: (familyName: string) => Promise<{ success: boolean; family?: FamilyGroup; error?: string }>;
  joinFamily: (inviteCode: string) => Promise<{ success: boolean; family?: FamilyGroup; error?: string }>;
  leaveFamily: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'FEMSPEN_PROFILE';
const LOCAL_STORAGE_FAMILY_KEY = 'FEMSPEN_FAMILY';
const LOCAL_STORAGE_PENDING_REGISTRATION = 'FEMSPEN_PENDING_REGISTRATION';

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

const cleanForFirestore = <T,>(obj: T): T => {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = cleanForFirestore(val);
    }
  }
  return result as T;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Profile Listener & Cache
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
            const normalized: UserProfile = {
              ...cachedProfile,
              currency: cachedProfile.currency || 'INR',
              monthlyBudget: cachedProfile.monthlyBudget || { individual: 25000, family: 75000 },
            };
            setUserProfile(normalized);
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
                const normalized: UserProfile = {
                  ...data,
                  currency: data.currency || 'INR',
                  monthlyBudget: data.monthlyBudget || { individual: 25000, family: 75000 },
                };
                setUserProfile(normalized);
                localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${firebaseUser.uid}`, JSON.stringify(normalized));
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
        setFamily(null);
        setIsPinLocked(true);
        setLoading(false);
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubscribeAuth();
    };
  }, []);

  // Real-time Family Sync Listener
  useEffect(() => {
    if (!userProfile?.familyId) {
      setFamily(null);
      return;
    }

    const famStorageKey = `${LOCAL_STORAGE_FAMILY_KEY}_${userProfile.familyId}`;
    const cachedFam = localStorage.getItem(famStorageKey);
    if (cachedFam) {
      try {
        setFamily(JSON.parse(cachedFam));
      } catch {
        // ignore
      }
    }

    if (db) {
      const famRef = doc(db, 'families', userProfile.familyId);
      const unsub = onSnapshot(
        famRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const famData = docSnap.data() as FamilyGroup;
            setFamily(famData);
            localStorage.setItem(famStorageKey, JSON.stringify(famData));
          } else {
            setFamily(null);
          }
        },
        (err) => {
          console.warn('Family listener notice:', err.message);
        }
      );
      return () => unsub();
    }
  }, [userProfile?.familyId]);

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

  const signupWithEmail = async (
    email: string,
    pass: string,
    extraData?: {
      displayName?: string;
      dob?: string;
      gender?: Gender;
      phoneNumber?: string;
      photoUrl?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }

    try {
      if (extraData) {
        localStorage.setItem(LOCAL_STORAGE_PENDING_REGISTRATION, JSON.stringify(extraData));
      }
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
    setFamily(null);
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

    let pendingData: any = {};
    const pendingStr = localStorage.getItem(LOCAL_STORAGE_PENDING_REGISTRATION);
    if (pendingStr) {
      try {
        pendingData = JSON.parse(pendingStr);
        localStorage.removeItem(LOCAL_STORAGE_PENDING_REGISTRATION);
      } catch {
        // ignore
      }
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: pendingData.displayName || user.email.split('@')[0],
      dob: pendingData.dob || undefined,
      gender: pendingData.gender || undefined,
      phoneNumber: pendingData.phoneNumber || undefined,
      photoUrl: pendingData.photoUrl || undefined,
      pinHash,
      pinSalt,
      securityQuestion: question,
      securityAnswerHash: `${securityAnswerHash}:${answerSalt}`,
      currency: 'INR',
      monthlyBudget: {
        individual: 25000,
        family: 75000,
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
        await setDoc(doc(db, 'users', user.uid), cleanForFirestore(newProfile));
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
        await setDoc(doc(db, 'users', user.uid), cleanForFirestore(updatedProfile));
      } catch (err: any) {
        console.warn('Note: PIN updated locally. Firestore sync notice:', err.message);
      }
    }

    return { success: true };
  };

  const lockSession = () => {
    setIsPinLocked(true);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!userProfile && !user) return;
    const uid = user?.uid || userProfile?.uid || 'local_user';
    const base: UserProfile = userProfile || {
      uid,
      email: user?.email || '',
      pinHash: '',
      pinSalt: '',
      securityQuestion: '',
      securityAnswerHash: '',
      currency: 'INR',
      monthlyBudget: { individual: 25000, family: 75000 },
      createdAt: Date.now(),
    };
    const updated: UserProfile = {
      ...base,
      ...updates,
    };

    setUserProfile(updated);
    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${uid}`, JSON.stringify(updated));

    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), cleanForFirestore(updated), { merge: true });
      } catch (err: any) {
        console.warn('Profile sync notice:', err.message);
      }
    }

    // If profile name or avatar updated and user belongs to a family, sync inside family document
    if (family && updated.familyId) {
      const updatedMembers: FamilyMember[] = family.members.map((m) =>
        m.uid === uid
          ? {
              ...m,
              displayName: updated.displayName || m.displayName,
              photoUrl: updated.photoUrl || m.photoUrl || undefined,
              phoneNumber: updated.phoneNumber || m.phoneNumber || undefined,
              gender: updated.gender || m.gender || undefined,
            }
          : m
      );
      const updatedFamily = { ...family, members: updatedMembers, updatedAt: Date.now() };
      setFamily(updatedFamily);
      localStorage.setItem(`${LOCAL_STORAGE_FAMILY_KEY}_${family.id}`, JSON.stringify(updatedFamily));
      if (db) {
        try {
          await updateDoc(doc(db, 'families', family.id), cleanForFirestore({
            members: updatedMembers,
            updatedAt: Date.now(),
          }));
        } catch {
          // ignore
        }
      }
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    await updateUserProfile({ currency: newCurrency });
  };

  const updateMonthlyBudget = async (mode: ExpenseMode, amount: number) => {
    const current = userProfile?.monthlyBudget || { individual: 25000, family: 75000 };
    await updateUserProfile({
      monthlyBudget: {
        ...current,
        [mode]: amount,
      },
    });
  };

  // Family Management: Create Family (Creator becomes Head of the Family)
  const createFamily = async (familyName: string): Promise<{ success: boolean; family?: FamilyGroup; error?: string }> => {
    if (!user) return { success: false, error: 'Must be signed in to create a family.' };

    const familyId = 'fam_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const inviteCode = `FS${randomDigits}`;

    const headMember: FamilyMember = {
      uid: user.uid,
      displayName: userProfile?.displayName || user.email.split('@')[0] || 'Family Head',
      role: 'head',
      photoUrl: userProfile?.photoUrl || undefined,
      phoneNumber: userProfile?.phoneNumber || undefined,
      gender: userProfile?.gender || undefined,
      joinedAt: Date.now(),
    };

    const newFamily: FamilyGroup = {
      id: familyId,
      name: familyName.trim() || 'My Family',
      inviteCode,
      headUserId: user.uid,
      headName: headMember.displayName,
      members: [headMember],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'families', familyId), cleanForFirestore(newFamily));
      } catch (err: any) {
        console.error('Firestore family creation error:', err);
        return { success: false, error: err.message || 'Failed to create family in cloud.' };
      }
    }

    setFamily(newFamily);
    localStorage.setItem(`${LOCAL_STORAGE_FAMILY_KEY}_${familyId}`, JSON.stringify(newFamily));

    await updateUserProfile({
      familyId,
      familyRole: 'head',
      familyName: newFamily.name,
    });

    return { success: true, family: newFamily };
  };

  // Family Management: Join an Existing Family via Invite Code
  const joinFamily = async (inviteCode: string): Promise<{ success: boolean; family?: FamilyGroup; error?: string }> => {
    if (!user) return { success: false, error: 'Must be signed in to join a family.' };

    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: 'Please enter a valid invite code.' };

    let foundFamily: FamilyGroup | null = null;

    if (db) {
      try {
        const q = query(collection(db, 'families'), where('inviteCode', '==', cleanCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundFamily = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as FamilyGroup;
        }
      } catch (err: any) {
        console.warn('Firestore family query notice:', err.message);
      }
    }

    // Local storage lookup fallback
    if (!foundFamily) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_FAMILY_KEY)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            if (parsed.inviteCode === cleanCode) {
              foundFamily = parsed;
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!foundFamily) {
      return {
        success: false,
        error: `No family found with invite code "${cleanCode}". Please verify the code with your family head.`,
      };
    }

    const currentMember: FamilyMember = {
      uid: user.uid,
      displayName: userProfile?.displayName || user.email.split('@')[0] || 'Family Member',
      role: 'member',
      photoUrl: userProfile?.photoUrl || undefined,
      phoneNumber: userProfile?.phoneNumber || undefined,
      gender: userProfile?.gender || undefined,
      joinedAt: Date.now(),
    };

    const updatedMembers = [
      ...foundFamily.members.filter((m) => m.uid !== user.uid),
      currentMember,
    ];

    const updatedFamily: FamilyGroup = {
      ...foundFamily,
      members: updatedMembers,
      updatedAt: Date.now(),
    };

    if (db) {
      try {
        await updateDoc(doc(db, 'families', foundFamily.id), cleanForFirestore({
          members: updatedMembers,
          updatedAt: Date.now(),
        }));
      } catch (err: any) {
        console.error('Firestore join family update error:', err);
        return { success: false, error: err.message || 'Failed to update family in cloud.' };
      }
    }

    setFamily(updatedFamily);
    localStorage.setItem(`${LOCAL_STORAGE_FAMILY_KEY}_${foundFamily.id}`, JSON.stringify(updatedFamily));

    await updateUserProfile({
      familyId: foundFamily.id,
      familyRole: 'member',
      familyName: foundFamily.name,
    });

    return { success: true, family: updatedFamily };
  };

  // Family Management: Leave Current Family
  const leaveFamily = async (): Promise<void> => {
    if (!user || !userProfile?.familyId) return;

    const currentFamId = userProfile.familyId;
    if (family && family.id === currentFamId) {
      const remainingMembers = family.members.filter((m) => m.uid !== user.uid);
      const updatedFamily = { ...family, members: remainingMembers, updatedAt: Date.now() };
      if (db) {
        try {
          await updateDoc(doc(db, 'families', currentFamId), cleanForFirestore({
            members: remainingMembers,
            updatedAt: Date.now(),
          }));
        } catch {
          // ignore
        }
      }
      localStorage.removeItem(`${LOCAL_STORAGE_FAMILY_KEY}_${currentFamId}`);
    }

    setFamily(null);
    await updateUserProfile({
      familyId: undefined,
      familyRole: undefined,
      familyName: undefined,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        family,
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
        updateUserProfile,
        createFamily,
        joinFamily,
        leaveFamily,
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
