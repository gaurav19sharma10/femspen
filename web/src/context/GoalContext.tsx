import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Goal,
  GoalTransaction,
  GoalType,
  SpendingRequest,
  RoundUpSettings,
  GoalTransactionType,
  GoalStatus,
} from '../types';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

interface GoalStats {
  totalSaved: number;
  activeGoalsCount: number;
  savedThisMonth: number;
  roundUpsThisMonth: number;
}

interface RoundUpNotice {
  id: number;
  amount: number;
  goalTitle: string;
}

interface GoalContextType {
  goals: Goal[];
  activeGoals: Goal[];
  completedGoals: Goal[];
  individualGoals: Goal[];
  groupGoals: Goal[];
  transactions: Record<string, GoalTransaction[]>;
  roundUpSettings: RoundUpSettings;
  stats: GoalStats;
  pendingApprovalCount: number;
  recentRoundUpNotice: RoundUpNotice | null;
  loading: boolean;
  createGoal: (goalData: Omit<Goal, 'id' | 'currentAmount' | 'status' | 'spendingRequests' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, type?: GoalTransactionType, expenseId?: string, notes?: string) => Promise<void>;
  requestSpending: (goalId: string, amount: number, reason: string, notes?: string) => Promise<string>;
  respondSpendingRequest: (goalId: string, requestId: string, decision: 'APPROVED' | 'REJECTED') => Promise<void>;
  executeWithdrawal: (goalId: string, amount: number, reason: string) => Promise<void>;
  togglePauseGoal: (goalId: string) => Promise<void>;
  closeGoal: (goalId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateRoundUpSettings: (settings: Partial<RoundUpSettings>) => void;
  processExpenseRoundUp: (expenseId: string, expenseAmount: number) => Promise<number>;
  dismissRoundUpNotice: () => void;
  fetchTransactions: (goalId: string) => Promise<GoalTransaction[]>;
}

const DEFAULT_ROUND_UP_SETTINGS: RoundUpSettings = {
  enabled: true,
  roundTo: 100, // Default to nearest ₹100
  destination: 'all',
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { validateAndDeductGoalContribution, creditGoalWithdrawalToWallet } = useWallet();
  const [personalGoals, setPersonalGoals] = useState<Goal[]>([]);
  const [familyGoals, setFamilyGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Record<string, GoalTransaction[]>>({});
  const [roundUpSettings, setRoundUpSettings] = useState<RoundUpSettings>(DEFAULT_ROUND_UP_SETTINGS);
  const [recentRoundUpNotice, setRecentRoundUpNotice] = useState<RoundUpNotice | null>(null);
  const [loading, setLoading] = useState(true);

  // Load round up settings from localStorage
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`FEMSPEN_ROUNDUP_SETTINGS_${user.uid}`);
    if (saved) {
      try {
        setRoundUpSettings(JSON.parse(saved));
      } catch {
        setRoundUpSettings(DEFAULT_ROUND_UP_SETTINGS);
      }
    }
  }, [user]);

  // Save round up settings
  const updateRoundUpSettings = (newSettings: Partial<RoundUpSettings>) => {
    setRoundUpSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (user) {
        localStorage.setItem(`FEMSPEN_ROUNDUP_SETTINGS_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Helper to sanitize Firestore undefined values
  const sanitize = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = sanitize(obj[key]);
      }
    }
    return res;
  };

  // Load & listen to Personal Goals (Private to the user)
  useEffect(() => {
    if (!user) {
      setPersonalGoals([]);
      setLoading(false);
      return;
    }

    const storageKey = `FEMSPEN_PERSONAL_GOALS_${user.uid}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setPersonalGoals(JSON.parse(cached));
      } catch {
        // ignore
      }
    }

    if (isFirebaseConfigured && db) {
      const goalsRef = collection(db, 'users', user.uid, 'goals');
      const q = query(goalsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: Goal[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || 'Untitled Goal',
              icon: data.icon || '🎯',
              category: data.category || 'Other',
              targetAmount: Number(data.targetAmount) || 0,
              currentAmount: Number(data.currentAmount) || 0,
              targetDate: data.targetDate || undefined,
              type: 'individual' as GoalType,
              ownerUid: data.ownerUid || user.uid,
              ownerName: data.ownerName || userProfile?.displayName || 'Me',
              participantUids: [user.uid],
              participants: [
                {
                  uid: user.uid,
                  name: userProfile?.displayName || 'Me',
                  photoUrl: userProfile?.photoUrl,
                  role: 'owner',
                },
              ],
              fundingMethod: data.fundingMethod || { manual: true },
              status: data.status || 'active',
              spendingRequests: data.spendingRequests || [],
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            };
          });

          setPersonalGoals(fetched);
          localStorage.setItem(storageKey, JSON.stringify(fetched));
          setLoading(false);
        },
        (err) => {
          console.warn('Personal goals listener notice:', err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user, userProfile?.displayName, userProfile?.photoUrl]);

  // Load & listen to Family Group Goals (Shared with family participants)
  useEffect(() => {
    if (!userProfile?.familyId) {
      setFamilyGoals([]);
      return;
    }

    const storageKey = `FEMSPEN_FAMILY_GOALS_${userProfile.familyId}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setFamilyGoals(JSON.parse(cached));
      } catch {
        // ignore
      }
    }

    if (isFirebaseConfigured && db) {
      const goalsRef = collection(db, 'families', userProfile.familyId, 'goals');
      const q = query(goalsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: Goal[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || 'Untitled Goal',
              icon: data.icon || '🎯',
              category: data.category || 'Other',
              targetAmount: Number(data.targetAmount) || 0,
              currentAmount: Number(data.currentAmount) || 0,
              targetDate: data.targetDate || undefined,
              type: 'group' as GoalType,
              ownerUid: data.ownerUid || '',
              ownerName: data.ownerName || 'Family Member',
              participantUids: data.participantUids || [],
              participants: data.participants || [],
              familyId: userProfile.familyId,
              fundingMethod: data.fundingMethod || { manual: true },
              status: data.status || 'active',
              spendingRequests: data.spendingRequests || [],
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            };
          });

          setFamilyGoals(fetched);
          localStorage.setItem(storageKey, JSON.stringify(fetched));
        },
        (err) => {
          console.warn('Family goals listener notice:', err.message);
        }
      );

      return () => unsubscribe();
    }
  }, [userProfile?.familyId]);

  // Combined goals:
  // Individual goals (only if created by current user) +
  // Group goals (only if current user is in participantUids)
  const goals = useMemo(() => {
    const myUid = user?.uid;
    const personal = personalGoals.filter((g) => g.ownerUid === myUid);
    const group = familyGoals.filter((g) => !myUid || g.participantUids.includes(myUid));
    return [...personal, ...group].sort((a, b) => b.createdAt - a.createdAt);
  }, [personalGoals, familyGoals, user?.uid]);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === 'completed'), [goals]);
  const individualGoals = useMemo(() => goals.filter((g) => g.type === 'individual'), [goals]);
  const groupGoals = useMemo(() => goals.filter((g) => g.type === 'group'), [goals]);

  // Pending approvals counter (Spending requests in group goals waiting for action)
  const pendingApprovalCount = useMemo(() => {
    const myUid = user?.uid;
    if (!myUid) return 0;
    let count = 0;
    groupGoals.forEach((g) => {
      g.spendingRequests?.forEach((req) => {
        if (req.status === 'PENDING' && req.approvals[myUid] === 'PENDING') {
          count++;
        }
      });
    });
    return count;
  }, [groupGoals, user?.uid]);

  // Financial Stats Calculation
  const stats = useMemo<GoalStats>(() => {
    let totalSaved = 0;
    let savedThisMonth = 0;
    let roundUpsThisMonth = 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startMs = startOfMonth.getTime();

    goals.forEach((g) => {
      totalSaved += g.currentAmount;
    });

    Object.values(transactions).forEach((txList) => {
      txList.forEach((tx) => {
        if (tx.timestamp >= startMs) {
          if (tx.type !== 'WITHDRAWAL' && tx.type !== 'SPENDING_APPROVED') {
            savedThisMonth += tx.amount;
          }
          if (tx.type === 'ROUND_UP') {
            roundUpsThisMonth += tx.amount;
          }
        }
      });
    });

    return {
      totalSaved,
      activeGoalsCount: activeGoals.length,
      savedThisMonth,
      roundUpsThisMonth,
    };
  }, [goals, activeGoals.length, transactions]);

  // Fetch transactions for a specific goal
  const fetchTransactions = async (goalId: string): Promise<GoalTransaction[]> => {
    if (transactions[goalId]) {
      return transactions[goalId];
    }

    const storageKey = `FEMSPEN_GOAL_TX_${goalId}`;
    const cached = localStorage.getItem(storageKey);
    let loaded: GoalTransaction[] = cached ? JSON.parse(cached) : [];

    const targetGoal = goals.find((g) => g.id === goalId);
    if (targetGoal && isFirebaseConfigured && db) {
      try {
        const isGroup = targetGoal.type === 'group' && targetGoal.familyId;
        const colRef = isGroup
          ? collection(db, 'families', targetGoal.familyId!, 'goals', goalId, 'transactions')
          : collection(db, 'users', targetGoal.ownerUid, 'goals', goalId, 'transactions');

        const q = query(colRef, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list: GoalTransaction[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              goalId: data.goalId || goalId,
              userId: data.userId || '',
              userName: data.userName || 'Member',
              amount: Number(data.amount) || 0,
              type: data.type || 'MANUAL_CONTRIBUTION',
              expenseId: data.expenseId,
              source: data.source,
              notes: data.notes,
              timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now()),
            };
          });
          setTransactions((prev) => ({ ...prev, [goalId]: list }));
          localStorage.setItem(storageKey, JSON.stringify(list));
        });
        // initial return
        return loaded;
      } catch (err: any) {
        console.warn('Error fetching goal transactions:', err.message);
      }
    }

    setTransactions((prev) => ({ ...prev, [goalId]: loaded }));
    return loaded;
  };

  // Helper to add an audited transaction
  const recordTransaction = async (
    targetGoal: Goal,
    txData: Omit<GoalTransaction, 'id' | 'timestamp'>
  ): Promise<void> => {
    const now = Date.now();
    const tempTxId = 'tx_' + Math.random().toString(36).substring(2, 9);
    const newTx: GoalTransaction = {
      ...txData,
      id: tempTxId,
      timestamp: now,
    };

    setTransactions((prev) => {
      const existing = prev[targetGoal.id] || [];
      const updated = [newTx, ...existing];
      localStorage.setItem(`FEMSPEN_GOAL_TX_${targetGoal.id}`, JSON.stringify(updated));
      return { ...prev, [targetGoal.id]: updated };
    });

    if (isFirebaseConfigured && db) {
      try {
        const isGroup = targetGoal.type === 'group' && targetGoal.familyId;
        const colRef = isGroup
          ? collection(db, 'families', targetGoal.familyId!, 'goals', targetGoal.id, 'transactions')
          : collection(db, 'users', targetGoal.ownerUid, 'goals', targetGoal.id, 'transactions');

        await addDoc(colRef, {
          ...sanitize(newTx),
          timestamp: serverTimestamp(),
        });
      } catch (err: any) {
        console.warn('Record transaction sync error:', err.message);
      }
    }
  };

  // Create Goal
  const createGoal = async (
    goalData: Omit<Goal, 'id' | 'currentAmount' | 'status' | 'spendingRequests' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const now = Date.now();
    const tempId = 'goal_' + Math.random().toString(36).substring(2, 10);

    const newGoal: Goal = {
      ...goalData,
      id: tempId,
      currentAmount: 0,
      status: 'active',
      spendingRequests: [],
      createdAt: now,
      updatedAt: now,
    };

    if (newGoal.type === 'group' && userProfile?.familyId) {
      const updated = [newGoal, ...familyGoals];
      setFamilyGoals(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_GOALS_${userProfile.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const colRef = collection(db, 'families', userProfile.familyId, 'goals');
          const docRef = await addDoc(colRef, {
            ...sanitize(newGoal),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return docRef.id;
        } catch (err: any) {
          console.warn('Create family goal error:', err.message);
        }
      }
      return tempId;
    } else {
      const updated = [newGoal, ...personalGoals];
      setPersonalGoals(updated);
      if (user) {
        localStorage.setItem(`FEMSPEN_PERSONAL_GOALS_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          const colRef = collection(db, 'users', user.uid, 'goals');
          const docRef = await addDoc(colRef, {
            ...sanitize(newGoal),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return docRef.id;
        } catch (err: any) {
          console.warn('Create personal goal error:', err.message);
        }
      }
      return tempId;
    }
  };

  // Update Goal
  const updateGoal = async (id: string, updates: Partial<Goal>): Promise<void> => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const now = Date.now();

    if (target.type === 'group' && target.familyId) {
      const updated = familyGoals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: now } : g));
      setFamilyGoals(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_GOALS_${target.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'families', target.familyId, 'goals', id);
          await updateDoc(docRef, sanitize({ ...updates, updatedAt: serverTimestamp() }));
        } catch (err: any) {
          console.warn('Update family goal error:', err.message);
        }
      }
    } else {
      const updated = personalGoals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: now } : g));
      setPersonalGoals(updated);
      if (user) {
        localStorage.setItem(`FEMSPEN_PERSONAL_GOALS_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'goals', id);
          await updateDoc(docRef, sanitize({ ...updates, updatedAt: serverTimestamp() }));
        } catch (err: any) {
          console.warn('Update personal goal error:', err.message);
        }
      }
    }
  };

  // Contribute money to a goal
  const contributeToGoal = async (
    goalId: string,
    amount: number,
    type: GoalTransactionType = 'MANUAL_CONTRIBUTION',
    expenseId?: string,
    notes?: string
  ): Promise<void> => {
    if (amount <= 0) return;
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;

    // 1. Enforce Wallet Rules: Validate and deduct funds from user's active wallet
    try {
      await validateAndDeductGoalContribution(goalId, target.title, amount);
    } catch (walletErr: any) {
      // Re-throw so callers can display specific wallet policy error messages
      throw walletErr;
    }

    const newAmount = target.currentAmount + amount;
    const isCompleted = newAmount >= target.targetAmount;
    const newStatus: GoalStatus = isCompleted && target.status === 'active' ? 'completed' : target.status;

    await updateGoal(goalId, {
      currentAmount: newAmount,
      status: newStatus,
    });

    await recordTransaction(target, {
      goalId,
      userId: user?.uid || 'guest',
      userName: userProfile?.displayName || userProfile?.email || 'Contributor',
      amount,
      type,
      expenseId,
      notes: notes || (isCompleted ? `Target of ₹${target.targetAmount.toLocaleString()} reached! 🎉` : undefined),
    });
  };

  // Request Spending from a Group Goal
  const requestSpending = async (
    goalId: string,
    amount: number,
    reason: string,
    notes?: string
  ): Promise<string> => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) throw new Error('Goal not found');
    if (amount > target.currentAmount) throw new Error('Requested amount exceeds current goal savings');

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    const initialApprovals: Record<string, 'APPROVED' | 'REJECTED' | 'PENDING'> = {};

    target.participantUids.forEach((uid) => {
      // Creator who requests automatically approves their own request
      initialApprovals[uid] = uid === user?.uid ? 'APPROVED' : 'PENDING';
    });

    const newRequest: SpendingRequest = {
      id: requestId,
      goalId,
      requestedByUid: user?.uid || '',
      requestedByName: userProfile?.displayName || 'Family Member',
      amount,
      reason,
      notes,
      status: 'PENDING',
      approvals: initialApprovals,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const existingRequests = target.spendingRequests || [];
    const updatedRequests = [newRequest, ...existingRequests];

    await updateGoal(goalId, { spendingRequests: updatedRequests });

    await recordTransaction(target, {
      goalId,
      userId: user?.uid || '',
      userName: userProfile?.displayName || 'Member',
      amount,
      type: 'SPENDING_REQUEST',
      notes: `Requested ₹${amount.toLocaleString()} for "${reason}"`,
    });

    // Check if there was only 1 participant (or already all approved)
    const allApproved = target.participantUids.every((uid) => initialApprovals[uid] === 'APPROVED');
    if (allApproved) {
      await respondSpendingRequest(goalId, requestId, 'APPROVED');
    }

    return requestId;
  };

  // Respond to a Spending Request (Approve or Reject)
  const respondSpendingRequest = async (
    goalId: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED'
  ): Promise<void> => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;
    const myUid = user?.uid;
    if (!myUid) return;

    const existingRequests = target.spendingRequests || [];
    const reqIndex = existingRequests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) return;

    const targetReq = { ...existingRequests[reqIndex] };
    const newApprovals = { ...targetReq.approvals, [myUid]: decision };
    targetReq.approvals = newApprovals;
    targetReq.updatedAt = Date.now();

    const userName = userProfile?.displayName || 'Family Member';

    if (decision === 'REJECTED') {
      targetReq.status = 'REJECTED';
      existingRequests[reqIndex] = targetReq;
      await updateGoal(goalId, { spendingRequests: [...existingRequests] });

      await recordTransaction(target, {
        goalId,
        userId: myUid,
        userName,
        amount: targetReq.amount,
        type: 'SPENDING_REJECTED',
        notes: `${userName} rejected withdrawal request for "${targetReq.reason}"`,
      });
      return;
    }

    // Check if unanimous approval is reached
    const allApproved = target.participantUids.every((uid) => newApprovals[uid] === 'APPROVED');

    if (allApproved) {
      targetReq.status = 'APPROVED';
      existingRequests[reqIndex] = targetReq;

      // Deduct balance
      const newBalance = Math.max(0, target.currentAmount - targetReq.amount);
      await updateGoal(goalId, {
        currentAmount: newBalance,
        spendingRequests: [...existingRequests],
      });

      // Credit released funds back to the requesting user's wallet
      try {
        await creditGoalWithdrawalToWallet(
          goalId,
          target.title,
          targetReq.amount,
          `Approved withdrawal for: ${targetReq.reason}`
        );
      } catch (walletErr: any) {
        console.warn('Could not credit wallet on spending release:', walletErr.message);
      }

      await recordTransaction(target, {
        goalId,
        userId: myUid,
        userName,
        amount: targetReq.amount,
        type: 'SPENDING_APPROVED',
        notes: `Unanimously approved! ₹${targetReq.amount.toLocaleString()} released for "${targetReq.reason}"`,
      });
    } else {
      existingRequests[reqIndex] = targetReq;
      await updateGoal(goalId, { spendingRequests: [...existingRequests] });
    }
  };

  // Execute direct withdrawal (for Individual Goals or Owner)
  const executeWithdrawal = async (goalId: string, amount: number, reason: string): Promise<void> => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;
    if (amount <= 0 || amount > target.currentAmount) throw new Error('Invalid withdrawal amount');

    const newBalance = Math.max(0, target.currentAmount - amount);
    await updateGoal(goalId, { currentAmount: newBalance });

    // Credit withdrawn funds back to user's wallet
    try {
      await creditGoalWithdrawalToWallet(goalId, target.title, amount, reason);
    } catch (walletErr: any) {
      console.warn('Could not credit wallet on goal withdrawal:', walletErr.message);
    }

    await recordTransaction(target, {
      goalId,
      userId: user?.uid || '',
      userName: userProfile?.displayName || 'Owner',
      amount,
      type: 'WITHDRAWAL',
      notes: reason ? `Withdrew ₹${amount.toLocaleString()} for "${reason}"` : `Withdrew ₹${amount.toLocaleString()}`,
    });
  };

  // Toggle Pause
  const togglePauseGoal = async (goalId: string): Promise<void> => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;
    const newStatus: GoalStatus = target.status === 'paused' ? 'active' : 'paused';
    await updateGoal(goalId, { status: newStatus });
  };

  // Close Goal
  const closeGoal = async (goalId: string): Promise<void> => {
    await updateGoal(goalId, { status: 'closed' });
  };

  // Delete Goal
  const deleteGoal = async (goalId: string): Promise<void> => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;

    if (target.type === 'group' && target.familyId) {
      const updated = familyGoals.filter((g) => g.id !== goalId);
      setFamilyGoals(updated);
      localStorage.setItem(`FEMSPEN_FAMILY_GOALS_${target.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'families', target.familyId, 'goals', goalId);
          await deleteDoc(docRef);
        } catch (err: any) {
          console.warn('Delete family goal error:', err.message);
        }
      }
    } else {
      const updated = personalGoals.filter((g) => g.id !== goalId);
      setPersonalGoals(updated);
      if (user) {
        localStorage.setItem(`FEMSPEN_PERSONAL_GOALS_${user.uid}`, JSON.stringify(updated));
      }

      if (isFirebaseConfigured && db && user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'goals', goalId);
          await deleteDoc(docRef);
        } catch (err: any) {
          console.warn('Delete personal goal error:', err.message);
        }
      }
    }
  };

  // Automatic Round-Up Savings Engine
  // Triggers whenever an expense is recorded
  const processExpenseRoundUp = async (expenseId: string, expenseAmount: number): Promise<number> => {
    if (!roundUpSettings.enabled || expenseAmount <= 0) return 0;
    const active = activeGoals;
    if (active.length === 0) return 0;

    const roundTo = roundUpSettings.roundTo || 100;
    const roundedCeil = Math.ceil(expenseAmount / roundTo) * roundTo;
    const spareChange = roundedCeil - expenseAmount;

    if (spareChange <= 0) return 0;

    let creditedTitles: string[] = [];

    if (roundUpSettings.destination === 'specific' && roundUpSettings.targetGoalId) {
      const target = active.find((g) => g.id === roundUpSettings.targetGoalId);
      if (target) {
        try {
          await contributeToGoal(
            target.id,
            spareChange,
            'ROUND_UP',
            expenseId,
            `₹${spareChange} spare change from ₹${expenseAmount.toLocaleString()} expense`
          );
          creditedTitles.push(target.title);
        } catch (walletErr: any) {
          console.warn('Spare change round-up skipped due to wallet rules:', walletErr.message);
        }
      }
    } else {
      // Allocate to all active goals
      // Check if custom allocations exist
      const allocations = roundUpSettings.allocations || {};
      const totalCustomPercent = Object.values(allocations).reduce((sum, v) => sum + v, 0);

      if (totalCustomPercent > 0) {
        for (const goal of active) {
          const percent = allocations[goal.id] || 0;
          if (percent > 0) {
            const chunk = Math.round((spareChange * percent) / 100);
            if (chunk > 0) {
              try {
                await contributeToGoal(
                  goal.id,
                  chunk,
                  'ROUND_UP',
                  expenseId,
                  `₹${chunk} round-up from ₹${expenseAmount.toLocaleString()} expense`
                );
                creditedTitles.push(goal.title);
              } catch (walletErr: any) {
                console.warn('Spare change round-up skipped for goal due to wallet rules:', walletErr.message);
              }
            }
          }
        }
      } else {
        // Distribute equally across active goals
        const share = Math.floor(spareChange / active.length);
        const remainder = spareChange % active.length;

        for (let i = 0; i < active.length; i++) {
          const goal = active[i];
          const chunk = share + (i === 0 ? remainder : 0);
          if (chunk > 0) {
            try {
              await contributeToGoal(
                goal.id,
                chunk,
                'ROUND_UP',
                expenseId,
                `₹${chunk} spare change from ₹${expenseAmount.toLocaleString()} expense`
              );
              creditedTitles.push(goal.title);
            } catch (walletErr: any) {
              console.warn('Spare change round-up skipped for goal due to wallet rules:', walletErr.message);
            }
          }
        }
      }
    }

    if (creditedTitles.length > 0) {
      setRecentRoundUpNotice({
        id: Date.now(),
        amount: spareChange,
        goalTitle: creditedTitles.join(', '),
      });
    }

    return spareChange;
  };

  const dismissRoundUpNotice = () => {
    setRecentRoundUpNotice(null);
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        activeGoals,
        completedGoals,
        individualGoals,
        groupGoals,
        transactions,
        roundUpSettings,
        stats,
        pendingApprovalCount,
        recentRoundUpNotice,
        loading,
        createGoal,
        updateGoal,
        contributeToGoal,
        requestSpending,
        respondSpendingRequest,
        executeWithdrawal,
        togglePauseGoal,
        closeGoal,
        deleteGoal,
        updateRoundUpSettings,
        processExpenseRoundUp,
        dismissRoundUpNotice,
        fetchTransactions,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoal = (): GoalContextType => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
};
