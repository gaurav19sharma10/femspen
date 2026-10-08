/**
 * Reporting: monthly totals, category and per-member breakdowns, budgets.
 *
 * Everything here reads from an already-filtered list of expenses so the screens
 * can decide the window (this month, last 90 days, all time) and reuse the same
 * functions.
 */

import type { Category, Expense, Member } from './types';

export type Bucket = { key: string; label: string; amountMinor: number; count: number };

/** `YYYY-MM`, matching how expenses are grouped for the trend chart. */
export function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short' });
}

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const isLive = (e: Expense): boolean => !e.deletedAt;

export function totalSpend(expenses: readonly Expense[]): number {
  return expenses.filter(isLive).reduce((sum, e) => sum + e.baseAmountMinor, 0);
}

export function totalPaidBy(
  expenses: readonly Expense[],
  memberIds: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const uid of memberIds) out[uid] = 0;
  for (const e of expenses) {
    if (!isLive(e)) continue;
    out[e.paidBy] = (out[e.paidBy] ?? 0) + e.baseAmountMinor;
  }
  return out;
}

/** How much each member consumed, i.e. their own share across all expenses. */
export function totalOwedBy(
  expenses: readonly Expense[],
  memberIds: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const uid of memberIds) out[uid] = 0;
  for (const e of expenses) {
    if (!isLive(e)) continue;
    for (const [uid, share] of Object.entries(e.splits)) {
      if (!Number.isFinite(share) || share <= 0) continue;
      out[uid] = (out[uid] ?? 0) + share;
    }
  }
  return out;
}

export function byCategory(
  expenses: readonly Expense[],
  categories: readonly Category[],
  currency: string,
): Bucket[] {
  const nameOf = new Map(categories.map((c) => [c.id, c]));
  const map = new Map<string, Bucket>();

  for (const e of expenses) {
    if (!isLive(e)) continue;
    const category = e.categoryId ? nameOf.get(e.categoryId) : undefined;
    const key = e.categoryId ?? 'uncategorised';
    const label = category?.name ?? (e.merchant ? e.merchant : 'Uncategorised');
    const existing = map.get(key);
    if (existing) {
      existing.amountMinor += e.baseAmountMinor;
      existing.count += 1;
    } else {
      map.set(key, { key, label, amountMinor: e.baseAmountMinor, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.amountMinor - a.amountMinor);
}

export function byMonth(expenses: readonly Expense[]): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const e of expenses) {
    if (!isLive(e)) continue;
    const key = monthKey(e.date);
    const existing = map.get(key);
    if (existing) {
      existing.amountMinor += e.baseAmountMinor;
      existing.count += 1;
    } else {
      map.set(key, { key, label: monthLabel(key), amountMinor: e.baseAmountMinor, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function byMember(
  expenses: readonly Expense[],
  members: readonly Member[],
  mode: 'paid' | 'consumed',
): Bucket[] {
  const nameOf = new Map(members.map((m) => [m.uid, m.displayName]));
  const totals = mode === 'paid' ? totalPaidBy(expenses, members.map((m) => m.uid)) : totalOwedBy(expenses, members.map((m) => m.uid));

  return members
    .map((m) => ({
      key: m.uid,
      label: nameOf.get(m.uid) ?? 'Unknown',
      amountMinor: totals[m.uid] ?? 0,
      count: 0,
    }))
    .filter((b) => b.amountMinor !== 0)
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

export function topMerchants(
  expenses: readonly Expense[],
  limit = 5,
): { name: string; amountMinor: number; count: number }[] {
  const map = new Map<string, { name: string; amountMinor: number; count: number }>();

  for (const e of expenses) {
    if (!isLive(e)) continue;
    const name = e.merchant?.trim() || e.description.trim();
    if (!name) continue;
    const existing = map.get(name.toLowerCase());
    if (existing) {
      existing.amountMinor += e.baseAmountMinor;
      existing.count += 1;
    } else {
      map.set(name.toLowerCase(), { name, amountMinor: e.baseAmountMinor, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.amountMinor - a.amountMinor).slice(0, limit);
}

export type BudgetStatus = {
  categoryId: string;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  /** 0-1+, may exceed 1 when over budget. */
  ratio: number;
  state: 'ok' | 'warning' | 'over';
};

/** Warn at 80% of the cap, matching how the progress bar is coloured. */
const WARNING_RATIO = 0.8;

export function budgetStatuses(
  expenses: readonly Expense[],
  categories: readonly Category[],
): BudgetStatus[] {
  const spent = new Map<string, number>();
  for (const e of expenses) {
    if (!isLive(e) || !e.categoryId) continue;
    spent.set(e.categoryId, (spent.get(e.categoryId) ?? 0) + e.baseAmountMinor);
  }

  return categories
    .filter((c) => typeof c.monthlyBudgetMinor === 'number' && c.monthlyBudgetMinor > 0)
    .map((c) => {
      const limitMinor = c.monthlyBudgetMinor as number;
      const spentMinor = spent.get(c.id) ?? 0;
      const ratio = limitMinor > 0 ? spentMinor / limitMinor : 0;
      return {
        categoryId: c.id,
        limitMinor,
        spentMinor,
        remainingMinor: Math.max(0, limitMinor - spentMinor),
        ratio,
        state: ratio >= 1 ? 'over' : ratio >= WARNING_RATIO ? 'warning' : 'ok',
      } satisfies BudgetStatus;
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export function householdBudgetStatus(
  expenses: readonly Expense[],
  monthlyBudgetMinor: number | null,
): { limitMinor: number; spentMinor: number; ratio: number; state: BudgetStatus['state'] } | null {
  if (!monthlyBudgetMinor || monthlyBudgetMinor <= 0) return null;
  const spentMinor = totalSpend(expenses);
  const ratio = spentMinor / monthlyBudgetMinor;
  return {
    limitMinor: monthlyBudgetMinor,
    spentMinor,
    ratio,
    state: ratio >= 1 ? 'over' : ratio >= WARNING_RATIO ? 'warning' : 'ok',
  };
}

/** Compare this month against the one before, as a signed fraction. */
export function monthOverMonthChange(
  expenses: readonly Expense[],
  now: Date,
): { currentMinor: number; previousMinor: number; changeRatio: number } {
  const current = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = monthKey(previousDate);

  let currentMinor = 0;
  let previousMinor = 0;

  for (const e of expenses) {
    if (!isLive(e)) continue;
    const key = monthKey(e.date);
    if (key === current) currentMinor += e.baseAmountMinor;
    else if (key === previous) previousMinor += e.baseAmountMinor;
  }

  return {
    currentMinor,
    previousMinor,
    // A jump from nothing to something has no meaningful percentage.
    changeRatio: previousMinor > 0 ? (currentMinor - previousMinor) / previousMinor : 0,
  };
}
