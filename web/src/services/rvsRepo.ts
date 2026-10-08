/**
 * Web Firestore repository for RVS Expences.
 * Direct real-time read and write matching the Android mobile application schema.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Activity,
  Category,
  Expense,
  Household,
  Member,
  MemberRole,
  PotContribution,
  Settlement,
  SettlementMethod,
  SplitMode,
  UserProfile,
} from '../domain/types';
import { sumSplits } from '../domain/split';
import { generateInviteCode } from '../domain/ids';

// Paths
export const usersCol = () => collection(db, 'users');
export const userDoc = (uid: string) => doc(db, 'users', uid);

export const householdsCol = () => collection(db, 'households');
export const householdDoc = (hid: string) => doc(db, 'households', hid);

export const membersCol = (hid: string) => collection(db, 'households', hid, 'members');
export const memberDoc = (hid: string, uid: string) => doc(db, 'households', hid, 'members', uid);

export const categoriesCol = (hid: string) => collection(db, 'households', hid, 'categories');
export const categoryDoc = (hid: string, cid: string) => doc(db, 'households', hid, 'categories', cid);

export const expensesCol = (hid: string) => collection(db, 'households', hid, 'expenses');
export const expenseDoc = (hid: string, eid: string) => doc(db, 'households', hid, 'expenses', eid);

export const settlementsCol = (hid: string) => collection(db, 'households', hid, 'settlements');
export const settlementDoc = (hid: string, sid: string) => doc(db, 'households', hid, 'settlements', sid);

export const topupsCol = (hid: string) => collection(db, 'households', hid, 'topups');
export const topupDoc = (hid: string, tid: string) => doc(db, 'households', hid, 'topups', tid);

export const activityCol = (hid: string) => collection(db, 'households', hid, 'activity');

export const personalExpensesCol = (uid: string) => collection(db, 'users', uid, 'personalExpenses');
export const personalExpenseDoc = (uid: string, eid: string) => doc(db, 'users', uid, 'personalExpenses', eid);

export const invitesCol = () => collection(db, 'invites');
export const inviteDoc = (code: string) => doc(db, 'invites', code);

// Default category template
export const DEFAULT_CATEGORIES = [
  { name: 'Food & dining', icon: 'utensils', color: '#10B981', order: 1 },
  { name: 'Transport', icon: 'car', color: '#0057FF', order: 2 },
  { name: 'Groceries', icon: 'basket', color: '#14B8A6', order: 3 },
  { name: 'Bills & utilities', icon: 'bolt', color: '#F59E0B', order: 4 },
  { name: 'Home', icon: 'home', color: '#6366F1', order: 5 },
  { name: 'Shopping', icon: 'bag', color: '#EC4899', order: 6 },
  { name: 'Health', icon: 'heart', color: '#EF4444', order: 7 },
  { name: 'Education', icon: 'book', color: '#8B5CF6', order: 8 },
  { name: 'Entertainment', icon: 'film', color: '#F97316', order: 9 },
  { name: 'General', icon: 'dots', color: '#64748B', order: 10 },
];

/** Fetch or initialize user profile */
export async function getOrCreateUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile & { householdIds: string[] }> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      uid,
      displayName: data.displayName || displayName || email.split('@')[0],
      email: data.email || email,
      photoURL: data.photoURL || null,
      displayCurrency: data.displayCurrency || 'INR',
      defaultWeight: data.defaultWeight || 1,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      householdIds: Array.isArray(data.householdIds) ? data.householdIds : [],
    };
  }

  const initialProfile = {
    uid,
    displayName: displayName || email.split('@')[0],
    email,
    photoURL: null,
    displayCurrency: 'INR',
    defaultWeight: 1,
    householdIds: [],
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, initialProfile);
  return {
    ...initialProfile,
    createdAt: new Date(),
  };
}

/** Auto discover household for user if householdIds array was not yet populated */
export async function discoverHouseholdForUser(uid: string): Promise<string | null> {
  const householdsQuery = query(householdsCol(), where('ownerUid', '==', uid), limit(1));
  const snap = await getDocs(householdsQuery);
  if (!snap.empty) {
    const hid = snap.docs[0].id;
    // Link to profile
    await linkHouseholdToProfile(uid, hid);
    return hid;
  }
  return null;
}

export async function linkHouseholdToProfile(uid: string, hid: string): Promise<void> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);
  const existing = Array.isArray(snap.data()?.householdIds) ? (snap.data()!.householdIds as string[]) : [];
  if (!existing.includes(hid)) {
    await updateDoc(ref, {
      householdIds: [...existing, hid],
    });
  }
}

/** Create Household */
export async function createHousehold(name: string, ownerUid: string, ownerName: string, ownerEmail: string, baseCurrency = 'INR'): Promise<string> {
  const inviteCode = generateInviteCode();
  const householdRef = await addDoc(householdsCol(), {
    name,
    baseCurrency,
    inviteCode,
    ownerUid,
    createdAt: serverTimestamp(),
    monthlyBudgetMinor: 200000, // ₹2,000.00 default
  });

  const hid = householdRef.id;

  // Set invite doc
  await setDoc(inviteDoc(inviteCode), {
    householdId: hid,
    householdName: name,
    active: true,
    createdBy: ownerUid,
    createdAt: serverTimestamp(),
  });

  // Add owner as member
  await setDoc(memberDoc(hid, ownerUid), {
    displayName: ownerName || 'Owner',
    email: ownerEmail,
    photoURL: null,
    role: 'owner',
    joinedAt: serverTimestamp(),
    defaultWeight: 1,
    monthlyBudgetMinor: null,
    inviteCode: null,
  });

  // Seed default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await addDoc(categoriesCol(hid), {
      ...cat,
      isSystem: true,
      monthlyBudgetMinor: 0,
    });
  }

  // Link to user profile
  await linkHouseholdToProfile(ownerUid, hid);

  return hid;
}

/** Join Household by Invite Code */
export async function joinHouseholdByCode(rawCode: string, uid: string, displayName: string, email: string): Promise<string> {
  const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const invSnap = await getDoc(inviteDoc(cleanCode));
  if (!invSnap.exists() || !invSnap.data()?.active) {
    throw new Error('Invalid or inactive invite code.');
  }

  const { householdId: hid } = invSnap.data() as { householdId: string };

  await setDoc(
    memberDoc(hid, uid),
    {
      displayName,
      email,
      photoURL: null,
      role: 'member',
      joinedAt: serverTimestamp(),
      defaultWeight: 1,
      monthlyBudgetMinor: null,
      inviteCode: null,
    },
    { merge: true }
  );

  await linkHouseholdToProfile(uid, hid);
  return hid;
}

/** Add Expense (Family Mode) */
export async function saveFamilyExpense(input: {
  householdId: string;
  description: string;
  notes?: string;
  amountMinor: number;
  currency: string;
  fxRate?: number;
  baseAmountMinor: number;
  paidBy: string;
  createdBy: string;
  splitMode: SplitMode;
  splits: Record<string, number>;
  categoryId: string | null;
  date: Date;
  color?: string;
  isPinned?: boolean;
  merchant?: string | null;
}): Promise<string> {
  const cleanSplits: Record<string, number> = {};
  for (const [k, v] of Object.entries(input.splits)) {
    cleanSplits[k] = Math.trunc(v);
  }
  const participantIds = Object.keys(cleanSplits);
  const baseAmountMinor = Math.trunc(input.baseAmountMinor);
  let splitTotalMinor = Math.trunc(sumSplits(cleanSplits));

  // If there is any 1-minor rounding disparity, reconcile with the first participant
  if (splitTotalMinor !== baseAmountMinor && participantIds.length > 0) {
    cleanSplits[participantIds[0]] += (baseAmountMinor - splitTotalMinor);
    splitTotalMinor = Math.trunc(sumSplits(cleanSplits));
  }

  const epochDay = Math.floor(input.date.getTime() / 86400000);
  const nowMs = Date.now();
  const cleanSplitMode = (input.splitMode || 'equal').toUpperCase();

  console.warn('📤 SAVING FAMILY EXPENSE TO FIRESTORE:', {
    householdId: input.householdId,
    paidBy: input.paidBy,
    createdBy: input.createdBy,
    participantIds,
    splits: cleanSplits,
    splitTotalMinor,
    baseAmountMinor,
    amountMinor: Math.trunc(input.amountMinor),
    dateEpochDay: epochDay,
    splitMode: cleanSplitMode,
  });

  let docRef;
  try {
    docRef = await addDoc(expensesCol(input.householdId), {
      amountMinor: Math.trunc(input.amountMinor),
      baseAmountMinor,
      splitTotalMinor,
      currency: input.currency || 'INR',
      fxRate: input.fxRate ?? 1,
      description: input.description.trim(),
      notes: input.notes?.trim() || null,
      merchant: input.merchant?.trim() || null,
      categoryId: input.categoryId || null,
      paidBy: input.paidBy,
      createdBy: input.createdBy,
      splitMode: cleanSplitMode,
      splits: cleanSplits,
      participantIds,
      dateEpochDay: epochDay,
      date: Timestamp.fromDate(input.date),
      sequence: null,
      receiptPath: null,
      recurringId: null,
      version: 1,
      createdAt: nowMs,
      updatedAt: nowMs,
      deletedAt: null,
      color: input.color || '#FFFFFF',
      isPinned: Boolean(input.isPinned),
    });
    console.warn('✅ EXPENSE SAVED SUCCESSFULLY TO FIRESTORE! Doc ID:', docRef.id);
  } catch (err: any) {
    console.error('❌ FIRESTORE WRITE REJECTED:', err?.code, err?.message, err);
    throw err;
  }

  // Log activity non-fatally
  try {
    await addDoc(activityCol(input.householdId), {
      householdId: input.householdId,
      kind: 'expense.created',
      actorUid: input.createdBy,
      summary: `added ${input.description.trim()}`.slice(0, 80),
      amountMinor: baseAmountMinor,
      targetId: docRef.id,
      at: serverTimestamp(),
    });
  } catch (actErr) {
    console.warn('Activity log write (non-fatal):', actErr);
  }

  return docRef.id;
}

/** Update Expense (Family Mode) */
export async function updateFamilyExpense(
  hid: string,
  eid: string,
  input: {
    description: string;
    notes?: string;
    amountMinor: number;
    currency: string;
    fxRate?: number;
    baseAmountMinor: number;
    paidBy: string;
    splitMode: SplitMode;
    splits: Record<string, number>;
    categoryId: string | null;
    date: Date;
    color?: string;
    isPinned?: boolean;
    merchant?: string | null;
  },
  currentVersion = 1
): Promise<void> {
  const participantIds = Object.keys(input.splits);
  const splitTotalMinor = sumSplits(input.splits);

  if (splitTotalMinor !== input.baseAmountMinor) {
    throw new Error('The shares do not add up to the total.');
  }

  const epochDay = Math.floor(input.date.getTime() / 86400000);
  const nowMs = Date.now();
  const cleanSplitMode = (input.splitMode || 'equal').toUpperCase();

  await updateDoc(expenseDoc(hid, eid), {
    amountMinor: Math.trunc(input.amountMinor),
    baseAmountMinor: Math.trunc(input.baseAmountMinor),
    splitTotalMinor,
    currency: input.currency || 'INR',
    fxRate: input.fxRate ?? 1,
    description: input.description.trim(),
    notes: input.notes?.trim() || null,
    merchant: input.merchant?.trim() || null,
    categoryId: input.categoryId || null,
    paidBy: input.paidBy,
    splitMode: cleanSplitMode,
    splits: input.splits,
    participantIds,
    dateEpochDay: epochDay,
    date: Timestamp.fromDate(input.date),
    version: currentVersion + 1,
    updatedAt: nowMs,
    color: input.color || '#FFFFFF',
    isPinned: Boolean(input.isPinned),
  });
}

/** Soft delete expense */
export async function softDeleteExpense(hid: string, eid: string, actorUid: string, description: string): Promise<void> {
  await updateDoc(expenseDoc(hid, eid), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(activityCol(hid), {
    householdId: hid,
    kind: 'expense.deleted',
    actorUid,
    summary: `deleted ${description}`,
    amountMinor: null,
    targetId: eid,
    at: serverTimestamp(),
  });
}

/** Toggle Pin on expense */
export async function togglePinExpense(hid: string, eid: string, isPinned: boolean): Promise<void> {
  await updateDoc(expenseDoc(hid, eid), {
    isPinned,
    updatedAt: serverTimestamp(),
  });
}

/** Change color on expense */
export async function changeExpenseColor(hid: string, eid: string, color: string): Promise<void> {
  await updateDoc(expenseDoc(hid, eid), {
    color,
    updatedAt: serverTimestamp(),
  });
}

/** Record Settlement */
export async function recordSettlement(input: {
  householdId: string;
  fromUid: string;
  toUid: string;
  baseAmountMinor: number;
  currency: string;
  method: SettlementMethod;
  note?: string;
  createdBy: string;
}): Promise<string> {
  const ref = await addDoc(settlementsCol(input.householdId), {
    householdId: input.householdId,
    fromUid: input.fromUid,
    toUid: input.toUid,
    baseAmountMinor: input.baseAmountMinor,
    currency: input.currency,
    method: input.method,
    note: input.note || '',
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
    createdBy: input.createdBy,
    deletedAt: null,
  });

  await addDoc(activityCol(input.householdId), {
    householdId: input.householdId,
    kind: 'settlement.created',
    actorUid: input.createdBy,
    summary: `recorded payment of settlement`,
    amountMinor: input.baseAmountMinor,
    targetId: ref.id,
    at: serverTimestamp(),
  });

  return ref.id;
}

/** Add Family Pot Contribution */
export async function addPotContribution(input: {
  householdId: string;
  contributorUid: string;
  contributorName: string;
  amountMinor: number;
  note: string;
}): Promise<string> {
  const ref = await addDoc(topupsCol(input.householdId), {
    householdId: input.householdId,
    createdBy: input.contributorUid,
    contributorUid: input.contributorUid,
    contributorName: input.contributorName,
    amountMinor: input.amountMinor,
    note: input.note.trim() || 'Contribution',
    createdAt: serverTimestamp(),
  });

  await addDoc(activityCol(input.householdId), {
    householdId: input.householdId,
    kind: 'expense.created',
    actorUid: input.contributorUid,
    summary: `added to Family Pot (${input.note.trim() || 'Contribution'})`,
    amountMinor: input.amountMinor,
    targetId: ref.id,
    at: serverTimestamp(),
  });

  return ref.id;
}

/** Update Household Monthly Budget */
export async function updateHouseholdBudget(hid: string, monthlyBudgetMinor: number | null): Promise<void> {
  await updateDoc(householdDoc(hid), {
    monthlyBudgetMinor,
  });
}

// ---------------------------------------------------- Individual Mode CRUD

export async function savePersonalExpense(uid: string, input: {
  description: string;
  notes?: string;
  amountMinor: number;
  currency: string;
  categoryId: string | null;
  date: Date;
  color?: string;
  isPinned?: boolean;
  merchant?: string | null;
}): Promise<string> {
  const ref = await addDoc(personalExpensesCol(uid), {
    description: input.description.trim(),
    notes: input.notes?.trim() || '',
    amountMinor: input.amountMinor,
    currency: input.currency,
    categoryId: input.categoryId,
    date: Timestamp.fromDate(input.date),
    color: input.color || '#FFFFFF',
    isPinned: Boolean(input.isPinned),
    merchant: input.merchant?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return ref.id;
}

export async function updatePersonalExpense(
  uid: string,
  eid: string,
  input: {
    description: string;
    notes?: string;
    amountMinor: number;
    currency: string;
    categoryId: string | null;
    date: Date;
    color?: string;
    isPinned?: boolean;
    merchant?: string | null;
  }
): Promise<void> {
  await updateDoc(personalExpenseDoc(uid, eid), {
    description: input.description.trim(),
    notes: input.notes?.trim() || '',
    amountMinor: input.amountMinor,
    currency: input.currency,
    categoryId: input.categoryId,
    date: Timestamp.fromDate(input.date),
    color: input.color || '#FFFFFF',
    isPinned: Boolean(input.isPinned),
    merchant: input.merchant?.trim() || null,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeletePersonalExpense(uid: string, eid: string): Promise<void> {
  await updateDoc(personalExpenseDoc(uid, eid), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function togglePinPersonalExpense(uid: string, eid: string, isPinned: boolean): Promise<void> {
  await updateDoc(personalExpenseDoc(uid, eid), {
    isPinned,
    updatedAt: serverTimestamp(),
  });
}

export async function changePersonalExpenseColor(uid: string, eid: string, color: string): Promise<void> {
  await updateDoc(personalExpenseDoc(uid, eid), {
    color,
    updatedAt: serverTimestamp(),
  });
}
