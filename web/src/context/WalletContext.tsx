import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Wallet,
  WalletTransaction,
  WalletMoneyRequest,
  WalletTransfer,
  WalletSpendingLimits,
  FamilyWalletPolicy,
  WalletRecurringTransfer,
  WalletNotification,
  WalletType,
  WalletStatus,
  WalletTransactionType,
  WalletTransactionDirection,
  MoneyRequestStatus,
  NegativeBalancePolicy,
} from '../types';
import { useAuth } from './AuthContext';
import { useExpense } from './ExpenseContext';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

interface NegativeMemberAlert {
  memberUid: string;
  memberName: string;
  photoUrl?: string;
  negativeAmount: number;
  lastExpenseTime?: number;
}

interface WalletContextType {
  currentWallet: Wallet | null;
  allFamilyWallets: Wallet[];
  transactions: WalletTransaction[];
  allFamilyTransactions: WalletTransaction[];
  pendingRequests: WalletMoneyRequest[];
  myRequests: WalletMoneyRequest[];
  activeRequestState: 'none' | 'pending' | 'approved' | 'rejected';
  notifications: WalletNotification[];
  unreadNotificationCount: number;
  spendingLimits: Record<string, WalletSpendingLimits>;
  familyPolicy: FamilyWalletPolicy | null;
  recurringTransfers: WalletRecurringTransfer[];
  negativeBalanceMembers: NegativeMemberAlert[];
  loading: boolean;
  addMoney: (amount: number, fundingSource: string, note?: string) => Promise<string>;
  transferMoney: (recipientUid: string, amount: number, note?: string) => Promise<string>;
  sendMoneyRequest: (
    amount: number,
    reason: string,
    description?: string,
    category?: string,
    urgency?: 'Low' | 'Medium' | 'High' | 'Emergency'
  ) => Promise<string>;
  approveMoneyRequest: (requestId: string) => Promise<void>;
  rejectMoneyRequest: (requestId: string, rejectionReason?: string) => Promise<void>;
  cancelMoneyRequest: (requestId: string) => Promise<void>;
  deductExpenseFromWallet: (
    expenseId: string,
    amount: number,
    title: string,
    category: string
  ) => Promise<{ success: boolean; newBalance: number; warning?: string }>;
  adjustExpenseWalletDebit: (
    expenseId: string,
    oldAmount: number,
    newAmount: number,
    title: string
  ) => Promise<void>;
  reverseExpenseWalletDebit: (
    expenseId: string,
    amount: number,
    title: string
  ) => Promise<void>;
  freezeWallet: (targetUid: string) => Promise<void>;
  unfreezeWallet: (targetUid: string) => Promise<void>;
  updateSpendingLimits: (
    targetUid: string,
    limits: Partial<WalletSpendingLimits>
  ) => Promise<void>;
  updateFamilyPolicy: (policy: Partial<FamilyWalletPolicy>) => Promise<void>;
  createRecurringTransfer: (
    data: Omit<WalletRecurringTransfer, 'id' | 'createdAt' | 'nextRunAt'>
  ) => Promise<string>;
  toggleRecurringTransfer: (id: string) => Promise<void>;
  deleteRecurringTransfer: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  acknowledgeRequestState: () => void;
}

const DEFAULT_POLICY: FamilyWalletPolicy = {
  familyId: '',
  allowMemberSelfFunding: false,
  defaultNegativePolicy: 'ALLOW_UNLIMITED',
  defaultNegativeLimit: 2000,
  updatedAt: Date.now(),
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userProfile, family } = useAuth();
  const { currentMode } = useExpense();

  const [individualWallet, setIndividualWallet] = useState<Wallet | null>(null);
  const [individualTransactions, setIndividualTransactions] = useState<WalletTransaction[]>([]);

  const [familyWallets, setFamilyWallets] = useState<Wallet[]>([]);
  const [familyTransactions, setFamilyTransactions] = useState<WalletTransaction[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<WalletMoneyRequest[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<Record<string, WalletSpendingLimits>>({});
  const [familyPolicy, setFamilyPolicy] = useState<FamilyWalletPolicy | null>(null);
  const [recurringTransfers, setRecurringTransfers] = useState<WalletRecurringTransfer[]>([]);

  const [notifications, setNotifications] = useState<WalletNotification[]>([]);
  const [acknowledgedRequestId, setAcknowledgedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isFamilyMode = currentMode === 'family' && Boolean(userProfile?.familyId);
  const isHead = userProfile?.familyRole === 'head';
  const myUid = user?.uid;

  // Helper to sanitize Firestore payload
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

  // 1. INDIVIDUAL WALLET LOAD & LISTEN
  useEffect(() => {
    if (!myUid) {
      setIndividualWallet(null);
      setIndividualTransactions([]);
      return;
    }

    const storageKeyWallet = `FEMSPEN_INDIVIDUAL_WALLET_${myUid}`;
    const storageKeyTx = `FEMSPEN_INDIVIDUAL_WALLET_TX_${myUid}`;

    const cachedWallet = localStorage.getItem(storageKeyWallet);
    if (cachedWallet) {
      try {
        setIndividualWallet(JSON.parse(cachedWallet));
      } catch {}
    } else {
      // Default initial individual wallet
      const initWallet: Wallet = {
        id: `wallet_ind_${myUid}`,
        ownerUserId: myUid,
        ownerName: userProfile?.displayName || 'Me',
        currency: userProfile?.currency || 'INR',
        balance: 0,
        walletType: 'individual',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setIndividualWallet(initWallet);
      localStorage.setItem(storageKeyWallet, JSON.stringify(initWallet));
    }

    const cachedTx = localStorage.getItem(storageKeyTx);
    if (cachedTx) {
      try {
        setIndividualTransactions(JSON.parse(cachedTx));
      } catch {}
    }

    if (isFirebaseConfigured && db) {
      const walletDocRef = doc(db, 'users', myUid, 'wallet', 'main');
      const unsubWallet = onSnapshot(walletDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const w: Wallet = {
            id: snap.id,
            ownerUserId: myUid,
            ownerName: data.ownerName || userProfile?.displayName || 'Me',
            currency: data.currency || userProfile?.currency || 'INR',
            balance: Number(data.balance) || 0,
            walletType: 'individual',
            status: data.status || 'active',
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
          };
          setIndividualWallet(w);
          localStorage.setItem(storageKeyWallet, JSON.stringify(w));
        }
      });

      const txColRef = collection(db, 'users', myUid, 'wallet', 'main', 'transactions');
      const q = query(txColRef, orderBy('createdAt', 'desc'));
      const unsubTx = onSnapshot(q, (snap) => {
        const list: WalletTransaction[] = snap.docs.map((d) => {
          const dt = d.data();
          return {
            id: d.id,
            walletId: dt.walletId || `wallet_ind_${myUid}`,
            userId: dt.userId || myUid,
            userName: dt.userName || 'Me',
            type: dt.type || 'TOP_UP',
            direction: dt.direction || 'IN',
            amount: Number(dt.amount) || 0,
            resultingBalance: Number(dt.resultingBalance) || 0,
            currency: dt.currency || userProfile?.currency || 'INR',
            status: dt.status || 'COMPLETED',
            description: dt.description || '',
            notes: dt.notes,
            fundingSource: dt.fundingSource,
            relatedExpenseId: dt.relatedExpenseId,
            relatedRequestId: dt.relatedRequestId,
            relatedTransferId: dt.relatedTransferId,
            createdAt: dt.createdAt?.toMillis ? dt.createdAt.toMillis() : (dt.createdAt || Date.now()),
            createdBy: dt.createdBy || myUid,
          };
        });
        setIndividualTransactions(list);
        localStorage.setItem(storageKeyTx, JSON.stringify(list));
      });

      return () => {
        unsubWallet();
        unsubTx();
      };
    }
  }, [myUid, userProfile?.currency]);

  // 2. FAMILY WALLETS & LEDGER LOAD & LISTEN
  useEffect(() => {
    if (!userProfile?.familyId) {
      setFamilyWallets([]);
      setFamilyTransactions([]);
      setMoneyRequests([]);
      setSpendingLimits({});
      setFamilyPolicy(null);
      setRecurringTransfers([]);
      setLoading(false);
      return;
    }

    const famId = userProfile.familyId;
    const storageKeyWallets = `FEMSPEN_FAMILY_WALLETS_${famId}`;
    const storageKeyTx = `FEMSPEN_FAMILY_WALLET_TX_${famId}`;
    const storageKeyReq = `FEMSPEN_FAMILY_REQUESTS_${famId}`;

    const cachedWallets = localStorage.getItem(storageKeyWallets);
    if (cachedWallets) {
      try {
        setFamilyWallets(JSON.parse(cachedWallets));
      } catch {}
    }

    const cachedTx = localStorage.getItem(storageKeyTx);
    if (cachedTx) {
      try {
        setFamilyTransactions(JSON.parse(cachedTx));
      } catch {}
    }

    const cachedReq = localStorage.getItem(storageKeyReq);
    if (cachedReq) {
      try {
        setMoneyRequests(JSON.parse(cachedReq));
      } catch {}
    }

    if (isFirebaseConfigured && db) {
      // Listen to family wallets
      const walletsCol = collection(db, 'families', famId, 'wallets');
      const unsubWallets = onSnapshot(walletsCol, (snap) => {
        const fetched: Wallet[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUserId: data.ownerUserId || d.id,
            ownerName: data.ownerName || 'Family Member',
            familyId: famId,
            currency: data.currency || userProfile?.currency || 'INR',
            balance: Number(data.balance) || 0,
            walletType: 'family',
            status: data.status || 'active',
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
          };
        });
        setFamilyWallets(fetched);
        localStorage.setItem(storageKeyWallets, JSON.stringify(fetched));
        setLoading(false);
      });

      // Listen to family transactions
      const txCol = collection(db, 'families', famId, 'wallet_transactions');
      const qTx = query(txCol, orderBy('createdAt', 'desc'));
      const unsubTx = onSnapshot(qTx, (snap) => {
        const fetched: WalletTransaction[] = snap.docs.map((d) => {
          const dt = d.data();
          return {
            id: d.id,
            walletId: dt.walletId,
            familyId: famId,
            userId: dt.userId,
            userName: dt.userName || 'Member',
            type: dt.type || 'EXPENSE_DEBIT',
            direction: dt.direction || 'OUT',
            amount: Number(dt.amount) || 0,
            resultingBalance: Number(dt.resultingBalance) || 0,
            currency: dt.currency || userProfile?.currency || 'INR',
            status: dt.status || 'COMPLETED',
            description: dt.description || '',
            notes: dt.notes,
            fundingSource: dt.fundingSource,
            relatedExpenseId: dt.relatedExpenseId,
            relatedRequestId: dt.relatedRequestId,
            relatedTransferId: dt.relatedTransferId,
            relatedMemberUid: dt.relatedMemberUid,
            relatedMemberName: dt.relatedMemberName,
            createdAt: dt.createdAt?.toMillis ? dt.createdAt.toMillis() : (dt.createdAt || Date.now()),
            createdBy: dt.createdBy || '',
          };
        });
        setFamilyTransactions(fetched);
        localStorage.setItem(storageKeyTx, JSON.stringify(fetched));
      });

      // Listen to money requests
      const reqCol = collection(db, 'families', famId, 'wallet_requests');
      const qReq = query(reqCol, orderBy('createdAt', 'desc'));
      const unsubReq = onSnapshot(qReq, (snap) => {
        const fetched: WalletMoneyRequest[] = snap.docs.map((d) => {
          const dt = d.data();
          return {
            id: d.id,
            familyId: famId,
            requesterUserId: dt.requesterUserId,
            requesterName: dt.requesterName || 'Member',
            requesterPhotoUrl: dt.requesterPhotoUrl,
            requesterCurrentBalance: Number(dt.requesterCurrentBalance) || 0,
            amount: Number(dt.amount) || 0,
            reason: dt.reason || '',
            description: dt.description,
            category: dt.category,
            urgency: dt.urgency || 'Medium',
            status: dt.status || 'PENDING',
            rejectionReason: dt.rejectionReason,
            createdAt: dt.createdAt?.toMillis ? dt.createdAt.toMillis() : (dt.createdAt || Date.now()),
            resolvedAt: dt.resolvedAt?.toMillis ? dt.resolvedAt.toMillis() : dt.resolvedAt,
            resolvedBy: dt.resolvedBy,
          };
        });
        setMoneyRequests(fetched);
        localStorage.setItem(storageKeyReq, JSON.stringify(fetched));
      });

      // Listen to limits
      const limitsCol = collection(db, 'families', famId, 'wallet_limits');
      const unsubLimits = onSnapshot(limitsCol, (snap) => {
        const map: Record<string, WalletSpendingLimits> = {};
        snap.docs.forEach((d) => {
          const dt = d.data();
          map[d.id] = {
            id: d.id,
            familyId: famId,
            userId: d.id,
            dailyLimit: dt.dailyLimit ? Number(dt.dailyLimit) : undefined,
            monthlyLimit: dt.monthlyLimit ? Number(dt.monthlyLimit) : undefined,
            allowNegativeBalance: dt.allowNegativeBalance ?? true,
            negativeBalanceLimit: dt.negativeBalanceLimit ? Number(dt.negativeBalanceLimit) : undefined,
            negativeBalancePolicy: dt.negativeBalancePolicy || 'ALLOW_UNLIMITED',
            lowBalanceThreshold: dt.lowBalanceThreshold ? Number(dt.lowBalanceThreshold) : 500,
            updatedBy: dt.updatedBy || '',
            updatedAt: dt.updatedAt?.toMillis ? dt.updatedAt.toMillis() : (dt.updatedAt || Date.now()),
          };
        });
        setSpendingLimits(map);
      });

      return () => {
        unsubWallets();
        unsubTx();
        unsubReq();
        unsubLimits();
      };
    } else {
      setLoading(false);
    }
  }, [userProfile?.familyId]);

  // 3. USER NOTIFICATIONS LOAD & LISTEN
  useEffect(() => {
    if (!myUid) {
      setNotifications([]);
      return;
    }

    const storageKey = `FEMSPEN_WALLET_NOTIFICATIONS_${myUid}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setNotifications(JSON.parse(cached));
      } catch {}
    }

    if (isFirebaseConfigured && db) {
      const colRef = collection(db, 'users', myUid, 'wallet_notifications');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const list: WalletNotification[] = snap.docs.map((d) => {
          const dt = d.data();
          return {
            id: d.id,
            userId: myUid,
            familyId: dt.familyId,
            title: dt.title || '',
            message: dt.message || '',
            type: dt.type || 'REQUEST_RECEIVED',
            amount: dt.amount ? Number(dt.amount) : undefined,
            read: Boolean(dt.read),
            relatedMemberName: dt.relatedMemberName,
            relatedEntityId: dt.relatedEntityId,
            createdAt: dt.createdAt?.toMillis ? dt.createdAt.toMillis() : (dt.createdAt || Date.now()),
          };
        });
        setNotifications(list);
        localStorage.setItem(storageKey, JSON.stringify(list));
      });
      return () => unsub();
    }
  }, [myUid]);

  // Helper to send in-app notification
  const sendNotification = async (
    targetUserId: string,
    notificationData: Omit<WalletNotification, 'id' | 'userId' | 'createdAt' | 'read'>
  ) => {
    const tempId = 'notif_' + Math.random().toString(36).substring(2, 9);
    const newNotif: WalletNotification = {
      ...notificationData,
      id: tempId,
      userId: targetUserId,
      read: false,
      createdAt: Date.now(),
    };

    if (targetUserId === myUid) {
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem(`FEMSPEN_WALLET_NOTIFICATIONS_${myUid}`, JSON.stringify(updated));
        return updated;
      });
    }

    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'users', targetUserId, 'wallet_notifications');
        await addDoc(colRef, {
          ...sanitize(newNotif),
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.warn('Send notification error:', err.message);
      }
    }
  };

  // Determine current active wallet based on operating mode
  const currentWallet = useMemo<Wallet | null>(() => {
    if (isFamilyMode) {
      const found = familyWallets.find((w) => w.ownerUserId === myUid);
      if (found) return found;

      // If family wallet document doesn't exist yet for this member, build default
      if (myUid) {
        return {
          id: `wallet_fam_${myUid}`,
          ownerUserId: myUid,
          ownerName: userProfile?.displayName || 'Family Member',
          familyId: userProfile?.familyId,
          currency: userProfile?.currency || 'INR',
          balance: 0,
          walletType: 'family',
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
      return null;
    }
    return individualWallet;
  }, [isFamilyMode, familyWallets, individualWallet, myUid, userProfile]);

  // Current transactions list
  const transactions = useMemo<WalletTransaction[]>(() => {
    if (isFamilyMode) {
      // In Family Mode: if Head, sees family transactions; if Member, sees own transactions
      if (isHead) {
        return familyTransactions;
      }
      return familyTransactions.filter((tx) => tx.userId === myUid);
    }
    return individualTransactions;
  }, [isFamilyMode, isHead, familyTransactions, individualTransactions, myUid]);

  // Pending requests for Head
  const pendingRequests = useMemo(() => {
    return moneyRequests.filter((r) => r.status === 'PENDING');
  }, [moneyRequests]);

  // Requests created by current member
  const myRequests = useMemo(() => {
    return moneyRequests.filter((r) => r.requesterUserId === myUid);
  }, [moneyRequests, myUid]);

  // Home page pill status indicator
  const activeRequestState = useMemo<'none' | 'pending' | 'approved' | 'rejected'>(() => {
    if (!isFamilyMode) return 'none';

    // If Head: has pending request to review
    if (isHead) {
      return pendingRequests.length > 0 ? 'pending' : 'none';
    }

    // For Member: check latest request
    const latest = myRequests[0];
    if (!latest) return 'none';
    if (latest.id === acknowledgedRequestId) return 'none';

    if (latest.status === 'PENDING') return 'pending';
    if (latest.status === 'APPROVED') return 'approved';
    if (latest.status === 'REJECTED') return 'rejected';

    return 'none';
  }, [isFamilyMode, isHead, pendingRequests.length, myRequests, acknowledgedRequestId]);

  const acknowledgeRequestState = () => {
    if (myRequests[0]) {
      setAcknowledgedRequestId(myRequests[0].id);
    }
  };

  // Negative balance members list (for Head alert card)
  const negativeBalanceMembers = useMemo<NegativeMemberAlert[]>(() => {
    if (!isHead || !userProfile?.familyId) return [];

    return familyWallets
      .filter((w) => w.balance < 0)
      .map((w) => {
        const lastTx = familyTransactions.find((tx) => tx.userId === w.ownerUserId && tx.type === 'EXPENSE_DEBIT');
        return {
          memberUid: w.ownerUserId,
          memberName: w.ownerName,
          negativeAmount: Math.abs(w.balance),
          lastExpenseTime: lastTx?.createdAt,
        };
      });
  }, [isHead, userProfile?.familyId, familyWallets, familyTransactions]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Helper to record an immutable transaction & update wallet balance
  const executeLedgerUpdate = async (
    targetWallet: Wallet,
    txData: Omit<WalletTransaction, 'id' | 'resultingBalance' | 'createdAt'>
  ): Promise<number> => {
    const isCredit = txData.direction === 'IN';
    const newBalance = Math.round((targetWallet.balance + (isCredit ? txData.amount : -txData.amount)) * 100) / 100;
    const now = Date.now();
    const tempTxId = 'wtx_' + Math.random().toString(36).substring(2, 10);

    const fullTx: WalletTransaction = {
      ...txData,
      id: tempTxId,
      resultingBalance: newBalance,
      createdAt: now,
    };

    if (targetWallet.walletType === 'family' && targetWallet.familyId) {
      // Update local state
      const updatedWallets = familyWallets.map((w) =>
        w.ownerUserId === targetWallet.ownerUserId ? { ...w, balance: newBalance, updatedAt: now } : w
      );
      if (!familyWallets.some((w) => w.ownerUserId === targetWallet.ownerUserId)) {
        updatedWallets.push({ ...targetWallet, balance: newBalance, updatedAt: now });
      }
      setFamilyWallets(updatedWallets);
      localStorage.setItem(`FEMSPEN_FAMILY_WALLETS_${targetWallet.familyId}`, JSON.stringify(updatedWallets));

      const updatedTx = [fullTx, ...familyTransactions];
      setFamilyTransactions(updatedTx);
      localStorage.setItem(`FEMSPEN_FAMILY_WALLET_TX_${targetWallet.familyId}`, JSON.stringify(updatedTx));

      // Sync Firestore
      if (isFirebaseConfigured && db) {
        try {
          const wDoc = doc(db, 'families', targetWallet.familyId, 'wallets', targetWallet.ownerUserId);
          await setDoc(
            wDoc,
            sanitize({
              ...targetWallet,
              balance: newBalance,
              updatedAt: serverTimestamp(),
            }),
            { merge: true }
          );

          const txCol = collection(db, 'families', targetWallet.familyId, 'wallet_transactions');
          await addDoc(txCol, {
            ...sanitize(fullTx),
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          console.warn('Family ledger update sync error:', err.message);
        }
      }
    } else {
      // Individual mode
      const updatedW: Wallet = { ...targetWallet, balance: newBalance, updatedAt: now };
      setIndividualWallet(updatedW);
      localStorage.setItem(`FEMSPEN_INDIVIDUAL_WALLET_${targetWallet.ownerUserId}`, JSON.stringify(updatedW));

      const updatedTx = [fullTx, ...individualTransactions];
      setIndividualTransactions(updatedTx);
      localStorage.setItem(`FEMSPEN_INDIVIDUAL_WALLET_TX_${targetWallet.ownerUserId}`, JSON.stringify(updatedTx));

      if (isFirebaseConfigured && db && myUid) {
        try {
          const wDoc = doc(db, 'users', myUid, 'wallet', 'main');
          await setDoc(
            wDoc,
            sanitize({
              ...updatedW,
              updatedAt: serverTimestamp(),
            }),
            { merge: true }
          );

          const txCol = collection(db, 'users', myUid, 'wallet', 'main', 'transactions');
          await addDoc(txCol, {
            ...sanitize(fullTx),
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          console.warn('Individual ledger update sync error:', err.message);
        }
      }
    }

    return newBalance;
  };

  // 1. ADD MONEY (Top-Up)
  const addMoney = async (amount: number, fundingSource: string, note?: string): Promise<string> => {
    if (amount <= 0) throw new Error('Top-up amount must be greater than zero');
    if (!currentWallet) throw new Error('No active wallet found');

    if (currentWallet.status === 'frozen') {
      throw new Error('Your wallet is frozen. Contact your family head or unlock your vault.');
    }

    // In Family Mode, only Head can top-up by default, unless policy allows self-funding
    if (isFamilyMode && !isHead && !familyPolicy?.allowMemberSelfFunding) {
      throw new Error('Family members cannot add money directly. Please submit a money request to the family head.');
    }

    const txId = 'topup_' + Math.random().toString(36).substring(2, 9);
    await executeLedgerUpdate(currentWallet, {
      walletId: currentWallet.id,
      familyId: currentWallet.familyId,
      userId: currentWallet.ownerUserId,
      userName: currentWallet.ownerName,
      type: 'TOP_UP',
      direction: 'IN',
      amount,
      currency: currentWallet.currency,
      status: 'COMPLETED',
      description: `Wallet top-up (${fundingSource})`,
      notes: note,
      fundingSource,
      createdBy: myUid || '',
    });

    await sendNotification(currentWallet.ownerUserId, {
      title: 'Wallet Top-Up Completed',
      message: `₹${amount.toLocaleString()} added via ${fundingSource}.`,
      type: 'TRANSFER_RECEIVED',
      amount,
    });

    return txId;
  };

  // 2. TRANSFER MONEY TO FAMILY MEMBER (Family Head Only)
  const transferMoney = async (recipientUid: string, amount: number, note?: string): Promise<string> => {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');
    if (!isFamilyMode || !isHead) throw new Error('Only the Family Head can transfer funds directly');
    if (!currentWallet) throw new Error('Head wallet not found');
    if (currentWallet.status === 'frozen') throw new Error('Your wallet is frozen');

    if (currentWallet.balance < amount) {
      throw new Error(`Insufficient funds: Your available balance is ₹${currentWallet.balance.toLocaleString()}. Please add funds first.`);
    }

    const recipientWallet = familyWallets.find((w) => w.ownerUserId === recipientUid) || {
      id: `wallet_fam_${recipientUid}`,
      ownerUserId: recipientUid,
      ownerName: family?.members?.find((m) => m.uid === recipientUid)?.displayName || 'Family Member',
      familyId: userProfile?.familyId,
      currency: currentWallet.currency,
      balance: 0,
      walletType: 'family' as WalletType,
      status: 'active' as WalletStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (recipientWallet.status === 'frozen') {
      throw new Error(`Cannot transfer: ${recipientWallet.ownerName}'s wallet is frozen.`);
    }

    const transferId = 'trf_' + Math.random().toString(36).substring(2, 9);

    // 1. Debit Head
    await executeLedgerUpdate(currentWallet, {
      walletId: currentWallet.id,
      familyId: currentWallet.familyId,
      userId: currentWallet.ownerUserId,
      userName: currentWallet.ownerName,
      type: 'TRANSFER_OUT',
      direction: 'OUT',
      amount,
      currency: currentWallet.currency,
      status: 'COMPLETED',
      description: `Transfer to ${recipientWallet.ownerName}`,
      notes: note,
      relatedTransferId: transferId,
      relatedMemberUid: recipientUid,
      relatedMemberName: recipientWallet.ownerName,
      createdBy: myUid || '',
    });

    // 2. Credit Recipient
    await executeLedgerUpdate(recipientWallet, {
      walletId: recipientWallet.id,
      familyId: recipientWallet.familyId,
      userId: recipientWallet.ownerUserId,
      userName: recipientWallet.ownerName,
      type: 'TRANSFER_IN',
      direction: 'IN',
      amount,
      currency: recipientWallet.currency,
      status: 'COMPLETED',
      description: `Transfer from Family Head (${currentWallet.ownerName})`,
      notes: note,
      relatedTransferId: transferId,
      relatedMemberUid: currentWallet.ownerUserId,
      relatedMemberName: currentWallet.ownerName,
      createdBy: myUid || '',
    });

    // Notify recipient
    await sendNotification(recipientUid, {
      title: 'Money Received from Family Head',
      message: `₹${amount.toLocaleString()} was transferred to your wallet by ${currentWallet.ownerName}.${note ? ` Note: "${note}"` : ''}`,
      type: 'TRANSFER_RECEIVED',
      amount,
      relatedMemberName: currentWallet.ownerName,
      relatedEntityId: transferId,
    });

    return transferId;
  };

  // 3. SEND MONEY REQUEST (Family Member to Head)
  const sendMoneyRequest = async (
    amount: number,
    reason: string,
    description?: string,
    category?: string,
    urgency: 'Low' | 'Medium' | 'High' | 'Emergency' = 'Medium'
  ): Promise<string> => {
    if (amount <= 0) throw new Error('Requested amount must be greater than zero');
    if (!isFamilyMode || !userProfile?.familyId) {
      throw new Error('Money requests are available in Family Mode only');
    }

    const headUid = family?.headUserId;
    if (!headUid) throw new Error('No family head found to receive this request');

    const tempReqId = 'req_' + Math.random().toString(36).substring(2, 9);
    const newReq: WalletMoneyRequest = {
      id: tempReqId,
      familyId: userProfile.familyId,
      requesterUserId: myUid || '',
      requesterName: userProfile.displayName || 'Family Member',
      requesterPhotoUrl: userProfile.photoUrl,
      requesterCurrentBalance: currentWallet?.balance || 0,
      amount,
      reason,
      description,
      category,
      urgency,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    const updated = [newReq, ...moneyRequests];
    setMoneyRequests(updated);
    localStorage.setItem(`FEMSPEN_FAMILY_REQUESTS_${userProfile.familyId}`, JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'families', userProfile.familyId, 'wallet_requests');
        await addDoc(colRef, {
          ...sanitize(newReq),
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.warn('Money request sync error:', err.message);
      }
    }

    // Notify Family Head
    await sendNotification(headUid, {
      title: `Money Request: ₹${amount.toLocaleString()}`,
      message: `${newReq.requesterName} requested ₹${amount.toLocaleString()} for "${reason}". (Urgency: ${urgency})`,
      type: 'REQUEST_RECEIVED',
      amount,
      relatedMemberName: newReq.requesterName,
      relatedEntityId: tempReqId,
    });

    return tempReqId;
  };

  // 4. APPROVE MONEY REQUEST (Head Only)
  const approveMoneyRequest = async (requestId: string): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can approve money requests');
    const targetReq = moneyRequests.find((r) => r.id === requestId);
    if (!targetReq) throw new Error('Request not found');
    if (targetReq.status !== 'PENDING') throw new Error(`Request is already ${targetReq.status.toLowerCase()}`);

    const headWallet = currentWallet;
    if (!headWallet) throw new Error('Head wallet not found');
    if (headWallet.balance < targetReq.amount) {
      throw new Error(
        `Insufficient funds: Your available balance is ₹${headWallet.balance.toLocaleString()}. Please add at least ₹${(
          targetReq.amount - headWallet.balance
        ).toLocaleString()} before approving this request.`
      );
    }

    // Execute transfer
    await transferMoney(targetReq.requesterUserId, targetReq.amount, `Approved request: ${targetReq.reason}`);

    // Update request status to APPROVED
    const now = Date.now();
    const updatedRequests = moneyRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'APPROVED' as MoneyRequestStatus, resolvedAt: now, resolvedBy: myUid } : r
    );
    setMoneyRequests(updatedRequests);
    localStorage.setItem(`FEMSPEN_FAMILY_REQUESTS_${userProfile.familyId}`, JSON.stringify(updatedRequests));

    if (isFirebaseConfigured && db) {
      try {
        const reqDoc = doc(db, 'families', userProfile.familyId, 'wallet_requests', requestId);
        await updateDoc(reqDoc, {
          status: 'APPROVED',
          resolvedAt: serverTimestamp(),
          resolvedBy: myUid,
        });
      } catch (err: any) {
        console.warn('Approve request sync error:', err.message);
      }
    }

    // Notify requester
    await sendNotification(targetReq.requesterUserId, {
      title: 'Money Request Approved! 🎉',
      message: `Your request of ₹${targetReq.amount.toLocaleString()} for "${targetReq.reason}" was approved and deposited.`,
      type: 'REQUEST_APPROVED',
      amount: targetReq.amount,
      relatedEntityId: requestId,
    });
  };

  // 5. REJECT MONEY REQUEST (Head Only)
  const rejectMoneyRequest = async (requestId: string, rejectionReason?: string): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can reject money requests');
    const targetReq = moneyRequests.find((r) => r.id === requestId);
    if (!targetReq) throw new Error('Request not found');
    if (targetReq.status !== 'PENDING') throw new Error('Request already processed');

    const now = Date.now();
    const updatedRequests = moneyRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'REJECTED' as MoneyRequestStatus,
            rejectionReason: rejectionReason || 'Declined by family head',
            resolvedAt: now,
            resolvedBy: myUid,
          }
        : r
    );
    setMoneyRequests(updatedRequests);
    localStorage.setItem(`FEMSPEN_FAMILY_REQUESTS_${userProfile.familyId}`, JSON.stringify(updatedRequests));

    if (isFirebaseConfigured && db) {
      try {
        const reqDoc = doc(db, 'families', userProfile.familyId, 'wallet_requests', requestId);
        await updateDoc(reqDoc, {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Declined by family head',
          resolvedAt: serverTimestamp(),
          resolvedBy: myUid,
        });
      } catch (err: any) {
        console.warn('Reject request sync error:', err.message);
      }
    }

    // Notify requester
    await sendNotification(targetReq.requesterUserId, {
      title: 'Money Request Declined',
      message: `Your request of ₹${targetReq.amount.toLocaleString()} for "${targetReq.reason}" was declined.${
        rejectionReason ? ` Reason: ${rejectionReason}` : ''
      }`,
      type: 'REQUEST_REJECTED',
      amount: targetReq.amount,
      relatedEntityId: requestId,
    });
  };

  // 6. CANCEL MONEY REQUEST (By Requester)
  const cancelMoneyRequest = async (requestId: string): Promise<void> => {
    const targetReq = moneyRequests.find((r) => r.id === requestId);
    if (!targetReq) return;
    if (targetReq.requesterUserId !== myUid) throw new Error('You can only cancel your own requests');

    const updated = moneyRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'CANCELLED' as MoneyRequestStatus, resolvedAt: Date.now() } : r
    );
    setMoneyRequests(updated);
    if (userProfile?.familyId) {
      localStorage.setItem(`FEMSPEN_FAMILY_REQUESTS_${userProfile.familyId}`, JSON.stringify(updated));

      if (isFirebaseConfigured && db) {
        try {
          const reqDoc = doc(db, 'families', userProfile.familyId, 'wallet_requests', requestId);
          await updateDoc(reqDoc, { status: 'CANCELLED', resolvedAt: serverTimestamp() });
        } catch {}
      }
    }
  };

  // 7. EXPENSE INTEGRATION: DEDUCT EXPENSE FROM WALLET
  const deductExpenseFromWallet = async (
    expenseId: string,
    amount: number,
    title: string,
    category: string
  ): Promise<{ success: boolean; newBalance: number; warning?: string }> => {
    if (!currentWallet) {
      return { success: true, newBalance: 0 };
    }

    if (currentWallet.status === 'frozen') {
      throw new Error('Your wallet is frozen. Expenses cannot be recorded right now.');
    }

    const projectedBalance = Math.round((currentWallet.balance - amount) * 100) / 100;

    // In Family Mode: check member-specific limits
    if (isFamilyMode && myUid) {
      const limits = spendingLimits[myUid];

      // Check Negative Balance Policy
      if (projectedBalance < 0) {
        const policy = limits?.negativeBalancePolicy || familyPolicy?.defaultNegativePolicy || 'ALLOW_UNLIMITED';
        const negLimit = limits?.negativeBalanceLimit || familyPolicy?.defaultNegativeLimit || 2000;

        if (policy === 'BLOCK' || limits?.allowNegativeBalance === false) {
          throw new Error(
            `Spending blocked by family policy: Insufficient wallet balance (₹${currentWallet.balance.toLocaleString()}) and negative spending is not permitted.`
          );
        }

        if (policy === 'ALLOW_WITH_LIMIT' && projectedBalance < -negLimit) {
          throw new Error(
            `Spending blocked: This expense would cause your negative balance to exceed your limit of −₹${negLimit.toLocaleString()} (projected: −₹${Math.abs(
              projectedBalance
            ).toLocaleString()}).`
          );
        }
      }

      // Check Daily Limit
      if (limits?.dailyLimit) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaySpent = familyTransactions
          .filter((tx) => tx.userId === myUid && tx.type === 'EXPENSE_DEBIT' && tx.createdAt >= startOfDay.getTime())
          .reduce((sum, tx) => sum + tx.amount, 0);

        if (todaySpent + amount > limits.dailyLimit) {
          throw new Error(
            `Daily spending limit exceeded: Limit is ₹${limits.dailyLimit.toLocaleString()}, already spent ₹${todaySpent.toLocaleString()} today.`
          );
        }
      }
    }

    // Execute ledger deduction
    const newBalance = await executeLedgerUpdate(currentWallet, {
      walletId: currentWallet.id,
      familyId: currentWallet.familyId,
      userId: currentWallet.ownerUserId,
      userName: currentWallet.ownerName,
      type: 'EXPENSE_DEBIT',
      direction: 'OUT',
      amount,
      currency: currentWallet.currency,
      status: 'COMPLETED',
      description: `Expense: ${title} (${category})`,
      relatedExpenseId: expenseId,
      createdBy: myUid || '',
    });

    let warning: string | undefined = undefined;

    // Handle Negative Balance Alert
    if (newBalance < 0) {
      warning = `Your wallet is ₹${Math.abs(newBalance).toLocaleString()} below zero.`;

      // If in Family Mode: Notify Head immediately
      const headUid = family?.headUserId;
      if (isFamilyMode && headUid && headUid !== myUid) {
        await sendNotification(headUid, {
          title: `⚠️ Negative Wallet Alert: ${currentWallet.ownerName}`,
          message: `${currentWallet.ownerName} recorded an expense of ₹${amount.toLocaleString()} for "${title}". Their wallet balance is now −₹${Math.abs(
            newBalance
          ).toLocaleString()}.`,
          type: 'NEGATIVE_BALANCE',
          amount: Math.abs(newBalance),
          relatedMemberName: currentWallet.ownerName,
          relatedEntityId: expenseId,
        });
      }
    }

    return { success: true, newBalance, warning };
  };

  // 8. EXPENSE INTEGRATION: ADJUSTMENT ON EXPENSE EDIT
  const adjustExpenseWalletDebit = async (
    expenseId: string,
    oldAmount: number,
    newAmount: number,
    title: string
  ): Promise<void> => {
    if (!currentWallet) return;
    const diff = Math.round((newAmount - oldAmount) * 100) / 100;
    if (diff === 0) return;

    if (diff > 0) {
      // User spent more -> additional debit
      await executeLedgerUpdate(currentWallet, {
        walletId: currentWallet.id,
        familyId: currentWallet.familyId,
        userId: currentWallet.ownerUserId,
        userName: currentWallet.ownerName,
        type: 'EXPENSE_ADJUSTMENT',
        direction: 'OUT',
        amount: diff,
        currency: currentWallet.currency,
        status: 'COMPLETED',
        description: `Correction: +₹${diff.toLocaleString()} on "${title}"`,
        relatedExpenseId: expenseId,
        createdBy: myUid || '',
      });
    } else {
      // User reduced expense -> credit back difference
      const refund = Math.abs(diff);
      await executeLedgerUpdate(currentWallet, {
        walletId: currentWallet.id,
        familyId: currentWallet.familyId,
        userId: currentWallet.ownerUserId,
        userName: currentWallet.ownerName,
        type: 'EXPENSE_ADJUSTMENT',
        direction: 'IN',
        amount: refund,
        currency: currentWallet.currency,
        status: 'COMPLETED',
        description: `Correction: -₹${refund.toLocaleString()} on "${title}"`,
        relatedExpenseId: expenseId,
        createdBy: myUid || '',
      });
    }
  };

  // 9. EXPENSE INTEGRATION: REVERSAL ON EXPENSE DELETION
  const reverseExpenseWalletDebit = async (
    expenseId: string,
    amount: number,
    title: string
  ): Promise<void> => {
    if (!currentWallet || amount <= 0) return;

    await executeLedgerUpdate(currentWallet, {
      walletId: currentWallet.id,
      familyId: currentWallet.familyId,
      userId: currentWallet.ownerUserId,
      userName: currentWallet.ownerName,
      type: 'EXPENSE_REVERSAL',
      direction: 'IN',
      amount,
      currency: currentWallet.currency,
      status: 'COMPLETED',
      description: `Reversal for deleted expense: "${title}"`,
      relatedExpenseId: expenseId,
      createdBy: myUid || '',
    });
  };

  // 10. FREEZE / UNFREEZE WALLET (Family Head)
  const freezeWallet = async (targetUid: string): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can freeze member wallets');
    const updated = familyWallets.map((w) => (w.ownerUserId === targetUid ? { ...w, status: 'frozen' as WalletStatus } : w));
    setFamilyWallets(updated);
    localStorage.setItem(`FEMSPEN_FAMILY_WALLETS_${userProfile.familyId}`, JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        const wDoc = doc(db, 'families', userProfile.familyId, 'wallets', targetUid);
        await updateDoc(wDoc, { status: 'frozen', updatedAt: serverTimestamp() });
      } catch {}
    }

    await sendNotification(targetUid, {
      title: 'Wallet Frozen by Head',
      message: 'Your family wallet has been frozen. You cannot record expenses or withdraw funds until unfrozen.',
      type: 'WALLET_FROZEN',
    });
  };

  const unfreezeWallet = async (targetUid: string): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can unfreeze member wallets');
    const updated = familyWallets.map((w) => (w.ownerUserId === targetUid ? { ...w, status: 'active' as WalletStatus } : w));
    setFamilyWallets(updated);
    localStorage.setItem(`FEMSPEN_FAMILY_WALLETS_${userProfile.familyId}`, JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        const wDoc = doc(db, 'families', userProfile.familyId, 'wallets', targetUid);
        await updateDoc(wDoc, { status: 'active', updatedAt: serverTimestamp() });
      } catch {}
    }

    await sendNotification(targetUid, {
      title: 'Wallet Unfrozen! 🔓',
      message: 'Your family wallet is active again.',
      type: 'WALLET_UNFROZEN',
    });
  };

  // 11. UPDATE SPENDING LIMITS (Family Head)
  const updateSpendingLimits = async (targetUid: string, limits: Partial<WalletSpendingLimits>): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can configure spending limits');

    const updatedLimit: WalletSpendingLimits = {
      id: targetUid,
      familyId: userProfile.familyId,
      userId: targetUid,
      allowNegativeBalance: limits.allowNegativeBalance ?? true,
      negativeBalancePolicy: limits.negativeBalancePolicy || 'ALLOW_UNLIMITED',
      negativeBalanceLimit: limits.negativeBalanceLimit,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      lowBalanceThreshold: limits.lowBalanceThreshold || 500,
      updatedBy: myUid || '',
      updatedAt: Date.now(),
    };

    setSpendingLimits((prev) => ({ ...prev, [targetUid]: updatedLimit }));

    if (isFirebaseConfigured && db) {
      try {
        const lDoc = doc(db, 'families', userProfile.familyId, 'wallet_limits', targetUid);
        await setDoc(lDoc, sanitize({ ...updatedLimit, updatedAt: serverTimestamp() }), { merge: true });
      } catch {}
    }
  };

  // 12. UPDATE FAMILY POLICY
  const updateFamilyPolicy = async (policyUpdates: Partial<FamilyWalletPolicy>): Promise<void> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can configure family wallet policies');
    const newPolicy: FamilyWalletPolicy = {
      ...(familyPolicy || DEFAULT_POLICY),
      ...policyUpdates,
      familyId: userProfile.familyId,
      updatedAt: Date.now(),
    };

    setFamilyPolicy(newPolicy);

    if (isFirebaseConfigured && db) {
      try {
        const pDoc = doc(db, 'families', userProfile.familyId, 'wallet_policy', 'config');
        await setDoc(pDoc, sanitize({ ...newPolicy, updatedAt: serverTimestamp() }), { merge: true });
      } catch {}
    }
  };

  // 13. RECURRING TRANSFERS (Allowances)
  const createRecurringTransfer = async (
    data: Omit<WalletRecurringTransfer, 'id' | 'createdAt' | 'nextRunAt'>
  ): Promise<string> => {
    if (!isHead || !userProfile?.familyId) throw new Error('Only Family Head can schedule allowances');
    const tempId = 'rec_' + Math.random().toString(36).substring(2, 9);
    const newRec: WalletRecurringTransfer = {
      ...data,
      id: tempId,
      nextRunAt: Date.now() + 86400000,
      createdAt: Date.now(),
    };

    const updated = [newRec, ...recurringTransfers];
    setRecurringTransfers(updated);

    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'families', userProfile.familyId, 'wallet_recurring');
        await addDoc(colRef, { ...sanitize(newRec), createdAt: serverTimestamp() });
      } catch {}
    }

    return tempId;
  };

  const toggleRecurringTransfer = async (id: string): Promise<void> => {
    setRecurringTransfers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r))
    );
  };

  const deleteRecurringTransfer = async (id: string): Promise<void> => {
    setRecurringTransfers((prev) => prev.filter((r) => r.id !== id));
  };

  // 14. NOTIFICATIONS MANAGEMENT
  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (myUid) {
        localStorage.setItem(`FEMSPEN_WALLET_NOTIFICATIONS_${myUid}`, JSON.stringify(updated));
      }
      return updated;
    });

    if (isFirebaseConfigured && db && myUid) {
      try {
        const nDoc = doc(db, 'users', myUid, 'wallet_notifications', id);
        await updateDoc(nDoc, { read: true });
      } catch {}
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (myUid) {
        localStorage.setItem(`FEMSPEN_WALLET_NOTIFICATIONS_${myUid}`, JSON.stringify(updated));
      }
      return updated;
    });

    if (isFirebaseConfigured && db && myUid) {
      try {
        notifications.forEach((n) => {
          if (!n.read) {
            const nDoc = doc(db, 'users', myUid, 'wallet_notifications', n.id);
            updateDoc(nDoc, { read: true }).catch(() => {});
          }
        });
      } catch {}
    }
  };

  return (
    <WalletContext.Provider
      value={{
        currentWallet,
        allFamilyWallets: familyWallets,
        transactions,
        allFamilyTransactions: familyTransactions,
        pendingRequests,
        myRequests,
        activeRequestState,
        notifications,
        unreadNotificationCount,
        spendingLimits,
        familyPolicy,
        recurringTransfers,
        negativeBalanceMembers,
        loading,
        addMoney,
        transferMoney,
        sendMoneyRequest,
        approveMoneyRequest,
        rejectMoneyRequest,
        cancelMoneyRequest,
        deductExpenseFromWallet,
        adjustExpenseWalletDebit,
        reverseExpenseWalletDebit,
        freezeWallet,
        unfreezeWallet,
        updateSpendingLimits,
        updateFamilyPolicy,
        createRecurringTransfer,
        toggleRecurringTransfer,
        deleteRecurringTransfer,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        acknowledgeRequestState,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
