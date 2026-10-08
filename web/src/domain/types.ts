/**
 * The shared data model.
 *
 * These types describe what lives in Firestore. Anything the UI needs to
 * calculate (splits, balances) is stored already resolved, so a client never has
 * to re-derive a number that another member's device will read differently.
 *
 * Money is always an integer in minor units. Multi-currency rows additionally
 * carry `baseAmountMinor`: a permanent snapshot of the amount converted into the
 * household's base currency at the moment the expense was saved. Balances are
 * computed from the snapshot, so an old balance never shifts because a rate
 * moved, and every device agrees on the number without needing a rates API.
 */

import type { SplitMode } from './split';
export type { SplitMode };

export type MemberRole = 'owner' | 'member';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  /** The currency this member prefers to see their own figures in. */
  displayCurrency: string;
  defaultWeight: number;
  createdAt: Date;
};

/** A "family" in the product sense. */
export type Household = {
  id: string;
  name: string;
  /** Every ledger amount in this household is expressed in this currency. */
  baseCurrency: string;
  inviteCode: string;
  ownerUid: string;
  memberIds: string[];
  createdAt: Date;
  /** Monthly budget for the whole household, in base currency minor units. */
  monthlyBudgetMinor: number | null;
};

export type Member = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: MemberRole;
  joinedAt: Date;
  defaultWeight: number;
  /** Per-member share of the household budget, in base currency minor units. */
  monthlyBudgetMinor: number | null;
};

export type Category = {
  id: string;
  name: string;
  /** Key into the vector icon set, not an emoji. */
  icon: string;
  color: string;
  order: number;
  isSystem: boolean;
  /** Monthly cap in base currency minor units, or null for no cap. */
  monthlyBudgetMinor: number | null;
};

export type Expense = {
  id: string;
  householdId: string;
  description: string;
  notes: string;

  /** The amount as entered, in `currency`. */
  amountMinor: number;
  currency: string;
  /** Rate used to convert into the base currency at save time. */
  fxRate: number;
  /** `amountMinor * fxRate`, rounded. The value all balance maths uses. */
  baseAmountMinor: number;

  paidBy: string;
  createdBy: string;

  splitMode: SplitMode;
  /** uid -> amount in *base currency* minor units. Always sums to baseAmountMinor. */
  splits: Record<string, number>;
  /**
   * The uids in `splits`, as a list. Stored so Firestore rules can assert that
   * the split map and the participant list describe the same set of people —
   * rules cannot iterate a map's keys, but they can compare against a list.
   */
  participantIds: string[];
  /** Self-consistency check: the client asserts this equals `baseAmountMinor`. */
  splitTotalMinor: number;
  categoryId: string | null;

  date: Date;
  createdAt: Date;
  updatedAt: Date;
  /** Bumped on every edit so a second device can detect a conflicting write. */
  version: number;

  receiptPath: string | null;
  /** Merchant name read off a receipt, when OCR found one. */
  merchant: string | null;
  recurringId: string | null;
  deletedAt: Date | null;
  /** Google Keep card pastel background tint */
  color?: string;
  /** Keep pinned state */
  isPinned?: boolean;
};

export type PotContribution = {
  id: string;
  householdId: string;
  contributorUid: string;
  contributorName: string;
  amountMinor: number;
  note: string;
  createdAt: Date;
};

export type SettlementMethod = 'cash' | 'bank' | 'upi' | 'other';

export type Settlement = {
  id: string;
  householdId: string;
  /** The person who handed over money. */
  fromUid: string;
  /** The person who received it. */
  toUid: string;
  baseAmountMinor: number;
  currency: string;
  method: SettlementMethod;
  note: string;
  date: Date;
  createdAt: Date;
  createdBy: string;
  deletedAt: Date | null;
};

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Recurring = {
  id: string;
  householdId: string;
  description: string;
  amountMinor: number;
  currency: string;
  fxRate: number;
  baseAmountMinor: number;
  paidBy: string;
  splitMode: SplitMode;
  splits: Record<string, number>;
  categoryId: string | null;
  cadence: Cadence;
  /** Day of month for monthly, day of week for weekly. */
  interval: number;
  /** When the next occurrence is due. */
  nextRunAt: Date;
  /** Usually the same as `nextRunAt`; retained for the history list. */
  startAt: Date;
  endAt: Date | null;
  active: boolean;
  /** Set once the occurrence has been turned into a real expense. */
  lastMaterialisedAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

export type ActivityKind =
  | 'expense.created'
  | 'expense.updated'
  | 'expense.deleted'
  | 'settlement.created'
  | 'settlement.deleted'
  | 'member.joined'
  | 'member.left'
  | 'member.removed'
  | 'recurring.created'
  | 'recurring.toggled';

export type Activity = {
  id: string;
  householdId: string;
  kind: ActivityKind;
  actorUid: string;
  /** A short human sentence, already localised by the writer. */
  summary: string;
  /** Amount involved, in base currency minor units, when relevant. */
  amountMinor: number | null;
  targetId: string | null;
  at: Date;
};

/** Firestore stores timestamps; these converters keep that in one place. */
export type TimestampLike = { toDate: () => Date };
