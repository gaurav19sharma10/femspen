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
import { INITIAL_DEMO_EXPENSES } from '../lib/seedData';

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

const LOCAL_STORAGE_EXPENSES_KEY = 'EXPENSE_TRACKER_LOCAL_EXPENSES';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentMode, setCurrentMode] = useState<ExpenseMode>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
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
              currency: data.currency || userProfile?.currency || 'USD',
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
          setExpenses(fetched);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore snapshot error, falling back to local storage:', error);
          loadLocalExpenses();
        }
      );

      return () => unsubscribe();
    } else {
      loadLocalExpenses();
    }
  }, [user, userProfile?.currency]);

  const loadLocalExpenses = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch {
        setExpenses(INITIAL_DEMO_EXPENSES);
      }
    } else {
      setExpenses(INITIAL_DEMO_EXPENSES);
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(INITIAL_DEMO_EXPENSES));
    }
    setLoading(false);
  };

  const persistLocal = (updated: Expense[]) => {
    setExpenses(updated);
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = Date.now();
    const newExpensePayload = {
      ...data,
      mode: currentMode,
      currency: data.currency || userProfile?.currency || 'USD',
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db && user) {
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const docRef = await addDoc(expensesRef, {
        ...newExpensePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } else {
      const id = 'exp-' + Math.random().toString(36).substring(2, 9);
      const newExp: Expense = { ...newExpensePayload, id };
      const updated = [newExp, ...expenses];
      persistLocal(updated);
      return id;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
    const now = Date.now();
    if (isFirebaseConfigured && db && user) {
      const docRef = doc(db, 'users', user.uid, 'expenses', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } else {
      const updated = expenses.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: now } : e
      );
      persistLocal(updated);
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db && user) {
      const docRef = doc(db, 'users', user.uid, 'expenses', id);
      await deleteDoc(docRef);
    } else {
      const updated = expenses.filter((e) => e.id !== id);
      persistLocal(updated);
    }
  };

  const togglePin = async (id: string): Promise<void> => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    await updateExpense(id, { isPinned: !target.isPinned });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.mode !== currentMode) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q) || false;
        const matchesCat = e.category.toLowerCase().includes(q);
        const matchesAmount = e.amount.toString().includes(q);
        const matchesMember = e.familyMember?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesNotes && !matchesCat && !matchesAmount && !matchesMember) {
          return false;
        }
      }

      if (selectedCategory && e.category !== selectedCategory) {
        return false;
      }

      if (selectedColor && e.color !== selectedColor) {
        return false;
      }

      return true;
    });
  }, [expenses, currentMode, searchQuery, selectedCategory, selectedColor]);

  const dateGroups: DateGroup[] = useMemo(() => {
    if (!filteredExpenses.length) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups: { [key: string]: { title: string; order: number; dateStr: string; expenses: Expense[] } } = {
      today: { title: 'Today', order: 1, dateStr: todayStr, expenses: [] },
      yesterday: { title: 'Yesterday', order: 2, dateStr: yesterdayStr, expenses: [] },
      thisWeek: { title: 'Earlier This Week', order: 3, dateStr: '', expenses: [] },
      thisMonth: { title: 'This Month', order: 4, dateStr: '', expenses: [] },
      older: { title: 'Older', order: 5, dateStr: '', expenses: [] },
    };

    filteredExpenses.forEach((exp) => {
      const expDate = exp.date ? new Date(exp.date) : new Date(exp.createdAt);
      const expDateStr = exp.date || expDate.toISOString().split('T')[0];

      if (expDateStr === todayStr) {
        groups.today.expenses.push(exp);
      } else if (expDateStr === yesterdayStr) {
        groups.yesterday.expenses.push(exp);
      } else if (expDate >= sevenDaysAgo) {
        groups.thisWeek.expenses.push(exp);
      } else if (expDate >= startOfMonth) {
        groups.thisMonth.expenses.push(exp);
      } else {
        groups.older.expenses.push(exp);
      }
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.expenses.length > 0)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, group]) => {
        const total = group.expenses.reduce((sum, item) => sum + item.amount, 0);
        return {
          id,
          title: group.title,
          dateStr: group.dateStr,
          totalAmount: total,
          expenses: group.expenses,
        };
      });
  }, [filteredExpenses]);

  const stats = useMemo(() => {
    const modeExpenses = expenses.filter((e) => e.mode === currentMode);
    const totalSpend = modeExpenses.reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyExpenses = modeExpenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));
    const monthlySpend = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    const budgetLimit = currentMode === 'individual'
      ? (userProfile?.monthlyBudget?.individual || 1500)
      : (userProfile?.monthlyBudget?.family || 4500);

    const budgetPercentage = budgetLimit > 0 ? Math.min(Math.round((monthlySpend / budgetLimit) * 100), 100) : 0;

    const categoryTotals: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    let topCatName = 'None';
    let topCatAmount = 0;
    Object.entries(categoryTotals).forEach(([name, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatName = name;
      }
    });

    return {
      totalSpend,
      monthlySpend,
      budgetLimit,
      budgetPercentage,
      topCategory: { name: topCatName, amount: topCatAmount },
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

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within an ExpenseProvider');
  return context;
};
