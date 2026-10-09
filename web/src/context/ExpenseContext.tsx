import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Expense, ExpenseMode, DateGroup } from '../types';

interface ExpenseContextType {
  expenses: Expense[];
  currentMode: ExpenseMode;
  setCurrentMode: (mode: ExpenseMode) => void;
  dateGroups: DateGroup[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  loading: boolean;
  isRulesLocked: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  stats: {
    totalSpend: number;
    monthlySpend: number;
    budgetLimit: number;
    budgetPercentage: number;
    topCategory: { name: string; amount: number };
  };
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const LOCAL_STORAGE_EXPENSES_KEY = 'FEMSPEN_EXPENSES';

const sanitizeForFirestore = (obj: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [personalExpenses, setPersonalExpenses] = useState<Expense[]>([]);
  const [familyExpenses, setFamilyExpenses] = useState<Expense[]>([]);
  const [currentMode, setCurrentMode] = useState<ExpenseMode>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRulesLocked, setIsRulesLocked] = useState(false);

  // Load and listen to user's personal Firestore expenses
  useEffect(() => {
    if (!user) {
      setPersonalExpenses([]);
      setLoading(false);
      return;
    }

    const storageKey = `${LOCAL_STORAGE_EXPENSES_KEY}_${user.uid}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setPersonalExpenses(JSON.parse(cached));
      } catch {
        // ignore
      }
    }

    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const q = query(expensesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setIsRulesLocked(false);
          const fetched: Expense[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || '',
              amount: Number(data.amount) || 0,
              currency: data.currency || userProfile?.currency || 'INR',
              category: data.category || 'General',
              mode: data.mode || 'individual',
              color: data.color || '#F8F7F4',
              isPinned: Boolean(data.isPinned),
              date: data.date || new Date().toISOString().split('T')[0],
              notes: data.notes || '',
              familyMember: data.familyMember || undefined,
              isRecurring: Boolean(data.isRecurring),
              recurringInterval: data.recurringInterval || undefined,
              receiptUrl: data.receiptUrl || undefined,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            };
          });

          setPersonalExpenses(fetched);
          localStorage.setItem(storageKey, JSON.stringify(fetched));
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore personal listener notice:', error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user, userProfile?.currency]);

  // Load and listen to shared family Firestore expenses
  useEffect(() => {
    if (!userProfile?.familyId) {
      setFamilyExpenses([]);
      return;
    }

    const famStorageKey = `FEMSPEN_FAMILY_EXPENSES_${userProfile.familyId}`;
    const cached = localStorage.getItem(famStorageKey);
    if (cached) {
      try {
        setFamilyExpenses(JSON.parse(cached));
      } catch {
        // ignore
      }
    }

    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, 'families', userProfile.familyId, 'expenses');
      const q = query(expensesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: Expense[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || '',
              amount: Number(data.amount) || 0,
              currency: data.currency || userProfile?.currency || 'INR',
              category: data.category || 'General',
              mode: 'family',
              color: data.color || '#F8F7F4',
              isPinned: Boolean(data.isPinned),
              date: data.date || new Date().toISOString().split('T')[0],
              notes: data.notes || '',
              familyMember: data.familyMember || undefined,
              isRecurring: Boolean(data.isRecurring),
              recurringInterval: data.recurringInterval || undefined,
              receiptUrl: data.receiptUrl || undefined,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            };
          });

          setFamilyExpenses(fetched);
          localStorage.setItem(famStorageKey, JSON.stringify(fetched));
        },
        (error) => {
          console.warn('Firestore family expenses listener notice:', error.message);
        }
      );

      return () => unsubscribe();
    }
  }, [userProfile?.familyId, userProfile?.currency]);

  // Combined active expenses list based on selected mode
  const expenses = useMemo(() => {
    if (currentMode === 'family') {
      return userProfile?.familyId
        ? familyExpenses
        : personalExpenses.filter((e) => e.mode === 'family');
    }
    return personalExpenses.filter((e) => e.mode === 'individual' || !e.mode);
  }, [currentMode, userProfile?.familyId, familyExpenses, personalExpenses]);

  const addExpense = async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = Date.now();
    const tempId = 'exp_' + Math.random().toString(36).substring(2, 10);
    const isFamilyShared = currentMode === 'family' && Boolean(userProfile?.familyId);

    const newExpense: Expense = {
      ...data,
      id: tempId,
      mode: currentMode,
      currency: data.currency || userProfile?.currency || 'INR',
      familyMember: currentMode === 'family' ? (data.familyMember || userProfile?.displayName || 'Family Member') : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (isFamilyShared && userProfile?.familyId) {
      const updated = [newExpense, ...familyExpenses];
      setFamilyExpenses(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_EXPENSES_${userProfile.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const colRef = collection(db, 'families', userProfile.familyId, 'expenses');
          const payload = sanitizeForFirestore({
            ...newExpense,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const docRef = await addDoc(colRef, payload);
          return docRef.id;
        } catch (err: any) {
          console.warn('Family expense sync error:', err.message);
        }
      }
      return tempId;
    } else {
      const updated = [newExpense, ...personalExpenses];
      setPersonalExpenses(updated);
      if (user) {
        localStorage.setItem(`${LOCAL_STORAGE_EXPENSES_KEY}_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          const colRef = collection(db, 'users', user.uid, 'expenses');
          const payload = sanitizeForFirestore({
            ...newExpense,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const docRef = await addDoc(colRef, payload);
          return docRef.id;
        } catch (err: any) {
          console.warn('Personal expense sync error:', err.message);
        }
      }
      return tempId;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
    const now = Date.now();
    const isFamilyTarget = familyExpenses.some((e) => e.id === id);

    if (isFamilyTarget && userProfile?.familyId) {
      const updated = familyExpenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now } : e));
      setFamilyExpenses(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_EXPENSES_${userProfile.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'families', userProfile.familyId, 'expenses', id);
          await updateDoc(docRef, sanitizeForFirestore({ ...updates, updatedAt: serverTimestamp() }));
        } catch (err: any) {
          console.warn('Family expense update error:', err.message);
        }
      }
    } else {
      const updated = personalExpenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now } : e));
      setPersonalExpenses(updated);
      if (user) {
        localStorage.setItem(`${LOCAL_STORAGE_EXPENSES_KEY}_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'expenses', id);
          await updateDoc(docRef, sanitizeForFirestore({ ...updates, updatedAt: serverTimestamp() }));
        } catch (err: any) {
          console.warn('Personal expense update error:', err.message);
        }
      }
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const isFamilyTarget = familyExpenses.some((e) => e.id === id);

    if (isFamilyTarget && userProfile?.familyId) {
      const updated = familyExpenses.filter((e) => e.id !== id);
      setFamilyExpenses(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_EXPENSES_${userProfile.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          await deleteDoc(doc(db, 'families', userProfile.familyId, 'expenses', id));
        } catch (err: any) {
          console.warn('Family expense delete error:', err.message);
        }
      }
    } else {
      const updated = personalExpenses.filter((e) => e.id !== id);
      setPersonalExpenses(updated);
      if (user) {
        localStorage.setItem(`${LOCAL_STORAGE_EXPENSES_KEY}_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
        } catch (err: any) {
          console.warn('Personal expense delete error:', err.message);
        }
      }
    }
  };

  const togglePin = async (id: string): Promise<void> => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    await updateExpense(id, { isPinned: !target.isPinned });
  };

  // Filter expenses by mode, category, color, and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.mode !== currentMode) return false;
      if (selectedCategory && e.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedColor && e.color.toLowerCase() !== selectedColor.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesCat = e.category.toLowerCase().includes(q);
        const matchesMember = (e.familyMember || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesCat && !matchesMember) return false;
      }
      return true;
    });
  }, [expenses, currentMode, selectedCategory, selectedColor, searchQuery]);

  // Group into Google Keep date buckets
  const dateGroups: DateGroup[] = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayItems: Expense[] = [];
    const yesterdayItems: Expense[] = [];
    const weekItems: Expense[] = [];
    const monthItems: Expense[] = [];
    const earlierItems: Expense[] = [];

    filteredExpenses.forEach((item) => {
      const itemDateStr = item.date;
      const itemDate = new Date(itemDateStr);

      if (itemDateStr === todayStr) {
        todayItems.push(item);
      } else if (itemDateStr === yesterdayStr) {
        yesterdayItems.push(item);
      } else if (itemDate >= oneWeekAgo) {
        weekItems.push(item);
      } else if (itemDate >= firstDayOfMonth) {
        monthItems.push(item);
      } else {
        earlierItems.push(item);
      }
    });

    const buildGroup = (id: string, title: string, items: Expense[]): DateGroup => ({
      id,
      title,
      dateStr: items[0]?.date || '',
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      expenses: items,
    });

    const groups: DateGroup[] = [];
    if (todayItems.length > 0) groups.push(buildGroup('today', 'Today', todayItems));
    if (yesterdayItems.length > 0) groups.push(buildGroup('yesterday', 'Yesterday', yesterdayItems));
    if (weekItems.length > 0) groups.push(buildGroup('week', 'Earlier This Week', weekItems));
    if (monthItems.length > 0) groups.push(buildGroup('month', 'This Month', monthItems));
    if (earlierItems.length > 0) groups.push(buildGroup('earlier', 'Earlier', earlierItems));

    return groups;
  }, [filteredExpenses]);

  // Financial Stats
  const stats = useMemo(() => {
    const currentModeExpenses = expenses.filter((e) => e.mode === currentMode);
    const totalSpend = currentModeExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlySpend = currentModeExpenses
      .filter((e) => e.date.startsWith(currentMonthPrefix))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const budgetLimit = userProfile?.monthlyBudget?.[currentMode] || (currentMode === 'individual' ? 1500 : 4500);
    const budgetPercentage = budgetLimit > 0 ? Math.min(100, Math.round((monthlySpend / budgetLimit) * 100)) : 0;

    const catMap: Record<string, number> = {};
    currentModeExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    let topCategory = { name: 'None', amount: 0 };
    Object.entries(catMap).forEach(([name, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = { name, amount };
      }
    });

    return {
      totalSpend,
      monthlySpend,
      budgetLimit,
      budgetPercentage,
      topCategory,
    };
  }, [expenses, currentMode, userProfile]);

  return (
    <ExpenseContext.Provider
      value={{
        expenses: filteredExpenses,
        currentMode,
        setCurrentMode,
        dateGroups,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedColor,
        setSelectedColor,
        loading,
        isRulesLocked,
        addExpense,
        updateExpense,
        deleteExpense,
        togglePin,
        stats,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within an ExpenseProvider');
  return context;
};

export const useExpense = useExpenses;
