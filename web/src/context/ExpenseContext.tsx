import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type {
  Activity,
  Category,
  Expense,
  Household,
  Member,
  PotContribution,
  Settlement,
  SettlementMethod,
  SplitMode,
} from '../domain/types';
import {
  computeBalances,
  type Transfer,
  type BalanceResult,
} from '../domain/balance';
import {
  saveFamilyExpense,
  updateFamilyExpense,
  softDeleteExpense,
  togglePinExpense,
  changeExpenseColor,
  recordSettlement as repoRecordSettlement,
  addPotContribution as repoAddPotContribution,
  updateHouseholdBudget,
  createHousehold,
  joinHouseholdByCode as repoJoinCode,
  savePersonalExpense,
  updatePersonalExpense,
  softDeletePersonalExpense,
  togglePinPersonalExpense,
  changePersonalExpenseColor,
  DEFAULT_CATEGORIES,
} from '../services/rvsRepo';

export type AppMode = 'individual' | 'family';

export interface UnifiedExpense {
  id: string;
  title: string;
  amountMinor: number;
  baseAmountMinor: number;
  currency: string;
  categoryName: string;
  categoryId: string | null;
  categoryIcon: string;
  categoryColor: string;
  date: Date;
  notes?: string;
  merchant?: string | null;
  color: string;
  isPinned: boolean;
  paidBy: string;
  paidByName: string;
  splitMode?: SplitMode;
  participantCount?: number;
  splits?: Record<string, number>;
  isPersonal?: boolean;
}

interface ExpenseContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  household: Household | null;
  members: Member[];
  categories: Category[];
  expenses: UnifiedExpense[];
  pinnedExpenses: UnifiedExpense[];
  unpinnedExpenses: UnifiedExpense[];
  settlements: Settlement[];
  potContributions: PotContribution[];
  potTotalMinor: number;
  activities: Activity[];
  balanceResult: BalanceResult | null;
  settlementTransfers: Transfer[];
  loading: boolean;
  isSyncing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (catId: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  // Actions
  addExpense: (input: {
    title: string;
    amount: number;
    currency: string;
    categoryId: string | null;
    date: Date;
    merchant?: string;
    notes?: string;
    color?: string;
    isPinned?: boolean;
    splitMode?: SplitMode;
    splits?: Record<string, number>;
  }) => Promise<string>;
  editExpense: (
    id: string,
    input: {
      title: string;
      amount: number;
      currency: string;
      categoryId: string | null;
      date: Date;
      merchant?: string;
      notes?: string;
      color?: string;
      isPinned?: boolean;
      splitMode?: SplitMode;
      splits?: Record<string, number>;
    }
  ) => Promise<void>;
  deleteExpense: (id: string, title: string) => Promise<void>;
  togglePin: (id: string, currentPinned: boolean) => Promise<void>;
  setCardColor: (id: string, color: string) => Promise<void>;
  makeSettlement: (fromUid: string, toUid: string, amountMinor: number, method: SettlementMethod, note?: string) => Promise<string>;
  addMoneyToPot: (amountMinor: number, note: string) => Promise<string>;
  changeBudget: (monthlyBudgetMinor: number | null) => Promise<void>;
  createFamily: (name: string) => Promise<string>;
  joinFamily: (code: string) => Promise<string>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, activeHouseholdId, setActiveHouseholdId } = useAuth();
  const [mode, setMode] = useState<AppMode>('family');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Household data states
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [familyExpenses, setFamilyExpenses] = useState<Expense[]>([]);
  const [personalExpenses, setPersonalExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [potContributions, setPotContributions] = useState<PotContribution[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Subscribe to Active Household details
  useEffect(() => {
    if (!activeHouseholdId) {
      setHousehold(null);
      setMembers([]);
      setCategories([]);
      setFamilyExpenses([]);
      setSettlements([]);
      setPotContributions([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    setIsSyncing(true);

    // Household document listener
    const unsubHousehold = onSnapshot(doc(db, 'households', activeHouseholdId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setHousehold({
          id: snap.id,
          name: d.name || 'Family',
          baseCurrency: d.baseCurrency || 'INR',
          inviteCode: d.inviteCode || '',
          ownerUid: d.ownerUid || '',
          memberIds: Array.isArray(d.memberIds) ? d.memberIds : [],
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          monthlyBudgetMinor: d.monthlyBudgetMinor ?? 200000,
        });
      }
    });

    // Members listener (must query where inviteCode == null per Firestore rules)
    const membersQuery = query(
      collection(db, 'households', activeHouseholdId, 'members'),
      where('inviteCode', '==', null)
    );
    const unsubMembers = onSnapshot(
      membersQuery,
      (snap) => {
        const list: Member[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              displayName: data.displayName || 'Member',
              email: data.email || '',
              photoURL: data.photoURL || null,
              role: data.role || 'member',
              joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(),
              defaultWeight: data.defaultWeight || 1,
              monthlyBudgetMinor: data.monthlyBudgetMinor ?? null,
            };
          })
          .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
        console.warn('👥 MEMBERS SYNCED FROM FIRESTORE:', JSON.stringify(list.map(m => ({ uid: m.uid, name: m.displayName, role: m.role }))));
        setMembers(list);
      },
      (err) => {
        console.error('Error listening to members:', err);
      }
    );

    // Categories listener
    const unsubCategories = onSnapshot(
      collection(db, 'households', activeHouseholdId, 'categories'),
      (snap) => {
        const list: Category[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || '',
              icon: data.icon || 'dots',
              color: data.color || '#64748B',
              order: data.order || 0,
              isSystem: Boolean(data.isSystem),
              monthlyBudgetMinor: data.monthlyBudgetMinor ?? null,
            };
          })
          .sort((a, b) => a.order - b.order);
        setCategories(list);
      },
      (err) => {
        console.error('Error listening to categories:', err);
      }
    );

    // Family Expenses listener
    const unsubExpenses = onSnapshot(
      collection(db, 'households', activeHouseholdId, 'expenses'),
      (snap) => {
        const list: Expense[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: data.householdId || activeHouseholdId,
              description: data.description || '',
              notes: data.notes || '',
              amountMinor: Number(data.amountMinor) || 0,
              currency: data.currency || 'INR',
              fxRate: Number(data.fxRate) || 1.0,
              baseAmountMinor: Number(data.baseAmountMinor) || 0,
              paidBy: data.paidBy || '',
              createdBy: data.createdBy || '',
              splitMode: (String(data.splitMode || 'equal').toLowerCase()) as SplitMode,
              splits: data.splits || {},
              participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
              splitTotalMinor: Number(data.splitTotalMinor) || 0,
              categoryId: data.categoryId || null,
              date: data.date?.toDate
                ? data.date.toDate()
                : typeof data.dateEpochDay === 'number'
                ? new Date(data.dateEpochDay * 86400000)
                : typeof data.createdAt === 'number'
                ? new Date(data.createdAt)
                : new Date(),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(Number(data.createdAt) || Date.now()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(Number(data.updatedAt) || Date.now()),
              version: Number(data.version) || 1,
              receiptPath: data.receiptPath || null,
              merchant: data.merchant || null,
              recurringId: data.recurringId || null,
              deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt || null,
              color: data.color || '#FFFFFF',
              isPinned: Boolean(data.isPinned),
            };
          })
          .filter((e) => !e.deletedAt)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        console.warn(`📦 Loaded ${list.length} family expenses for household: ${activeHouseholdId}`);
        if (snap.docs.length > 0) {
          console.warn('🔍 LIVE ANDROID EXPENSE SAMPLE DATA:', JSON.stringify(snap.docs[0].data()));
        }
        setFamilyExpenses(list);
        setIsSyncing(false);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to family expenses:', err);
        setIsSyncing(false);
        setLoading(false);
      }
    );

    // Settlements listener
    const unsubSettlements = onSnapshot(
      collection(db, 'households', activeHouseholdId, 'settlements'),
      (snap) => {
        const list: Settlement[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: activeHouseholdId,
              fromUid: data.fromUid || '',
              toUid: data.toUid || '',
              baseAmountMinor: Number(data.baseAmountMinor) || 0,
              currency: data.currency || 'INR',
              method: data.method || 'cash',
              note: data.note || '',
              date: data.date?.toDate ? data.date.toDate() : new Date(),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              createdBy: data.createdBy || '',
              deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt || null,
            };
          })
          .filter((s) => !s.deletedAt)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        setSettlements(list);
      },
      (err) => {
        console.error('Error listening to settlements:', err);
      }
    );

    // Family Pot listener (topups subcollection)
    const unsubPot = onSnapshot(
      collection(db, 'households', activeHouseholdId, 'topups'),
      (snap) => {
        const list: PotContribution[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: activeHouseholdId,
              contributorUid: data.contributorUid || '',
              contributorName: data.contributorName || 'Family Member',
              amountMinor: Number(data.amountMinor) || 0,
              note: data.note || '',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPotContributions(list);
      },
      (err) => {
        console.error('Error listening to family pot topups:', err);
      }
    );

    // Activity feed listener
    const unsubActivity = onSnapshot(
      collection(db, 'households', activeHouseholdId, 'activity'),
      (snap) => {
        const list: Activity[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: activeHouseholdId,
              kind: data.kind || 'expense.created',
              actorUid: data.actorUid || '',
              summary: data.summary || '',
              amountMinor: data.amountMinor != null ? Number(data.amountMinor) : null,
              targetId: data.targetId || null,
              at: data.at?.toDate ? data.at.toDate() : new Date(),
            };
          })
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .slice(0, 20);
        setActivities(list);
      },
      (err) => {
        console.error('Error listening to activity:', err);
      }
    );

    return () => {
      unsubHousehold();
      unsubMembers();
      unsubCategories();
      unsubExpenses();
      unsubSettlements();
      unsubPot();
      unsubActivity();
    };
  }, [activeHouseholdId]);

  // 2. Subscribe to Personal Expenses (Individual Mode)
  useEffect(() => {
    if (!user) {
      setPersonalExpenses([]);
      return;
    }

    const unsubPersonal = onSnapshot(
      collection(db, 'users', user.uid, 'personalExpenses'),
      (snap) => {
        const list = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              description: data.description || '',
              notes: data.notes || '',
              amountMinor: Number(data.amountMinor) || 0,
              currency: data.currency || 'INR',
              categoryId: data.categoryId || null,
              date: data.date?.toDate ? data.date.toDate() : new Date(),
              color: data.color || '#FFFFFF',
              isPinned: Boolean(data.isPinned),
              merchant: data.merchant || null,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt || null,
              isPersonal: true,
            };
          })
          .filter((e) => !e.deletedAt)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        setPersonalExpenses(list);
      },
      (err) => {
        console.warn('Personal expenses sync notice:', err?.message);
        setPersonalExpenses([]);
      }
    );

    return () => unsubPersonal();
  }, [user]);

  // Map category by ID
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Map member by UID
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.uid, m));
    return map;
  }, [members]);

  // Calculate Balances and Settlements in Family Mode
  const balanceResult: BalanceResult | null = useMemo(() => {
    if (mode === 'individual' || members.length === 0) return null;
    const memberIds = members.map((m) => m.uid);
    return computeBalances(memberIds, familyExpenses, settlements);
  }, [mode, familyExpenses, settlements, members]);

  const settlementTransfers: Transfer[] = useMemo(() => {
    return balanceResult?.transfers || [];
  }, [balanceResult]);

  // Total in Family Pot
  const potTotalMinor = useMemo(() => {
    return potContributions.reduce((acc, curr) => acc + curr.amountMinor, 0);
  }, [potContributions]);

  // Unify and filter expenses according to active mode & search criteria
  const unifiedExpenses: UnifiedExpense[] = useMemo(() => {
    if (mode === 'individual') {
      return personalExpenses.map((p) => {
        const cat = p.categoryId ? categoryMap.get(p.categoryId) : undefined;
        return {
          id: p.id,
          title: p.description,
          amountMinor: p.amountMinor,
          baseAmountMinor: p.amountMinor,
          currency: p.currency,
          categoryName: cat?.name || 'General',
          categoryId: p.categoryId,
          categoryIcon: cat?.icon || 'dots',
          categoryColor: cat?.color || '#64748B',
          date: p.date,
          notes: p.notes,
          merchant: p.merchant,
          color: p.color || '#FFFFFF',
          isPinned: p.isPinned,
          paidBy: user?.uid || '',
          paidByName: 'You (Personal)',
          isPersonal: true,
        };
      });
    }

    // Family Mode
    return familyExpenses.map((f) => {
      const cat = f.categoryId ? categoryMap.get(f.categoryId) : undefined;
      const payer = memberMap.get(f.paidBy);
      return {
        id: f.id,
        title: f.description,
        amountMinor: f.amountMinor,
        baseAmountMinor: f.baseAmountMinor,
        currency: f.currency,
        categoryName: cat?.name || 'General',
        categoryId: f.categoryId,
        categoryIcon: cat?.icon || 'dots',
        categoryColor: cat?.color || '#64748B',
        date: f.date,
        notes: f.notes,
        merchant: f.merchant,
        color: f.color || '#FFFFFF',
        isPinned: f.isPinned || false,
        paidBy: f.paidBy,
        paidByName: payer?.displayName || (f.paidBy === user?.uid ? 'You' : 'Member'),
        splitMode: f.splitMode,
        participantCount: f.participantIds?.length || 1,
        splits: f.splits,
        isPersonal: false,
      };
    });
  }, [mode, personalExpenses, familyExpenses, categoryMap, memberMap, user]);

  // Apply search and category filter
  const filteredExpenses = useMemo(() => {
    return unifiedExpenses.filter((e) => {
      if (selectedCategoryId && e.categoryId !== selectedCategoryId) return false;
      if (selectedColor && e.color !== selectedColor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchNotes = (e.notes || '').toLowerCase().includes(q);
        const matchMerchant = (e.merchant || '').toLowerCase().includes(q);
        const matchCat = e.categoryName.toLowerCase().includes(q);
        const matchPayer = e.paidByName.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchMerchant && !matchCat && !matchPayer) return false;
      }
      return true;
    });
  }, [unifiedExpenses, selectedCategoryId, selectedColor, searchQuery]);

  const pinnedExpenses = useMemo(() => filteredExpenses.filter((e) => e.isPinned), [filteredExpenses]);
  const unpinnedExpenses = useMemo(() => filteredExpenses.filter((e) => !e.isPinned), [filteredExpenses]);

  // Actions
  const addExpense = async (input: {
    title: string;
    amount: number;
    currency: string;
    categoryId: string | null;
    date: Date;
    merchant?: string;
    notes?: string;
    color?: string;
    isPinned?: boolean;
    splitMode?: SplitMode;
    splits?: Record<string, number>;
  }): Promise<string> => {
    if (!user) throw new Error('You must be signed in.');
    const amountMinor = Math.round(input.amount * 100);

    if (mode === 'individual') {
      return await savePersonalExpense(user.uid, {
        description: input.title,
        notes: input.notes,
        amountMinor,
        currency: input.currency,
        categoryId: input.categoryId,
        date: input.date,
        color: input.color,
        isPinned: input.isPinned,
        merchant: input.merchant,
      });
    }

    if (!activeHouseholdId) throw new Error('No active household selected.');

    // Split configuration
    let splits = input.splits;
    let splitMode = input.splitMode || 'equal';

    if (!splits || Object.keys(splits).length === 0) {
      splits = {};
      const participantList = members.length > 0 ? members.map((m) => m.uid) : [user.uid];
      if (!participantList.includes(user.uid)) {
        participantList.push(user.uid);
      }
      const share = Math.floor(amountMinor / participantList.length);
      let remainder = amountMinor - share * participantList.length;
      participantList.forEach((uid, idx) => {
        splits![uid] = share + (idx < remainder ? 1 : 0);
      });
    }

    return await saveFamilyExpense({
      householdId: activeHouseholdId,
      description: input.title,
      notes: input.notes,
      amountMinor,
      currency: input.currency,
      baseAmountMinor: amountMinor,
      paidBy: user.uid,
      createdBy: user.uid,
      splitMode,
      splits,
      categoryId: input.categoryId,
      date: input.date,
      color: input.color,
      isPinned: input.isPinned,
      merchant: input.merchant,
    });
  };

  const editExpense = async (
    id: string,
    input: {
      title: string;
      amount: number;
      currency: string;
      categoryId: string | null;
      date: Date;
      merchant?: string;
      notes?: string;
      color?: string;
      isPinned?: boolean;
      splitMode?: SplitMode;
      splits?: Record<string, number>;
    }
  ): Promise<void> => {
    if (!user) throw new Error('You must be signed in.');
    const amountMinor = Math.round(input.amount * 100);

    if (mode === 'individual') {
      await updatePersonalExpense(user.uid, id, {
        description: input.title,
        notes: input.notes,
        amountMinor,
        currency: input.currency,
        categoryId: input.categoryId,
        date: input.date,
        color: input.color,
        isPinned: input.isPinned,
        merchant: input.merchant,
      });
      return;
    }

    if (!activeHouseholdId) throw new Error('No active household selected.');

    let splits = input.splits;
    if (!splits || Object.keys(splits).length === 0) {
      splits = {};
      const participantList = members.length > 0 ? members.map((m) => m.uid) : [user.uid];
      if (!participantList.includes(user.uid)) {
        participantList.push(user.uid);
      }
      const share = Math.floor(amountMinor / participantList.length);
      let remainder = amountMinor - share * participantList.length;
      participantList.forEach((uid, idx) => {
        splits![uid] = share + (idx < remainder ? 1 : 0);
      });
    }

    await updateFamilyExpense(activeHouseholdId, id, {
      description: input.title,
      notes: input.notes,
      amountMinor,
      currency: input.currency,
      baseAmountMinor: amountMinor,
      paidBy: user.uid,
      splitMode: input.splitMode || 'equal',
      splits,
      categoryId: input.categoryId,
      date: input.date,
      color: input.color,
      isPinned: input.isPinned,
      merchant: input.merchant,
    });
  };

  const deleteExpense = async (id: string, title: string): Promise<void> => {
    if (!user) return;
    if (mode === 'individual') {
      await softDeletePersonalExpense(user.uid, id);
    } else if (activeHouseholdId) {
      await softDeleteExpense(activeHouseholdId, id, user.uid, title);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean): Promise<void> => {
    if (!user) return;
    if (mode === 'individual') {
      await togglePinPersonalExpense(user.uid, id, !currentPinned);
    } else if (activeHouseholdId) {
      await togglePinExpense(activeHouseholdId, id, !currentPinned);
    }
  };

  const setCardColor = async (id: string, color: string): Promise<void> => {
    if (!user) return;
    if (mode === 'individual') {
      await changePersonalExpenseColor(user.uid, id, color);
    } else if (activeHouseholdId) {
      await changeExpenseColor(activeHouseholdId, id, color);
    }
  };

  const makeSettlement = async (
    fromUid: string,
    toUid: string,
    amountMinor: number,
    method: SettlementMethod,
    note?: string
  ): Promise<string> => {
    if (!activeHouseholdId || !user) throw new Error('No active household.');
    return await repoRecordSettlement({
      householdId: activeHouseholdId,
      fromUid,
      toUid,
      baseAmountMinor: amountMinor,
      currency: household?.baseCurrency || 'INR',
      method,
      note,
      createdBy: user.uid,
    });
  };

  const addMoneyToPot = async (amountMinor: number, note: string): Promise<string> => {
    if (!activeHouseholdId || !user) throw new Error('No active household.');
    return await repoAddPotContribution({
      householdId: activeHouseholdId,
      contributorUid: user.uid,
      contributorName: userProfile?.displayName || user.email || 'You',
      amountMinor,
      note,
    });
  };

  const changeBudget = async (monthlyBudgetMinor: number | null): Promise<void> => {
    if (!activeHouseholdId) return;
    await updateHouseholdBudget(activeHouseholdId, monthlyBudgetMinor);
  };

  const createFamily = async (name: string): Promise<string> => {
    if (!user) throw new Error('You must be signed in.');
    const hid = await createHousehold(
      name,
      user.uid,
      userProfile?.displayName || user.email || 'Owner',
      user.email || ''
    );
    setActiveHouseholdId(hid);
    return hid;
  };

  const joinFamily = async (code: string): Promise<string> => {
    if (!user) throw new Error('You must be signed in.');
    const hid = await repoJoinCode(
      code,
      user.uid,
      userProfile?.displayName || user.email || 'Member',
      user.email || ''
    );
    setActiveHouseholdId(hid);
    return hid;
  };

  return (
    <ExpenseContext.Provider
      value={{
        mode,
        setMode,
        household,
        members,
        categories,
        expenses: filteredExpenses,
        pinnedExpenses,
        unpinnedExpenses,
        settlements,
        potContributions,
        potTotalMinor,
        activities,
        balanceResult,
        settlementTransfers,
        loading,
        isSyncing,
        searchQuery,
        setSearchQuery,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedColor,
        setSelectedColor,
        addExpense,
        editExpense,
        deleteExpense,
        togglePin,
        setCardColor,
        makeSettlement,
        addMoneyToPot,
        changeBudget,
        createFamily,
        joinFamily,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
