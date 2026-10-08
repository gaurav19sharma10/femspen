/**
 * CSV export.
 *
 * Follows RFC 4180 quoting so a description containing a comma or a quote does
 * not shift every following column when the file is opened in a spreadsheet.
 */

import { formatMoney, toMajor } from './currency';
import type { Member } from './types';

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

const NEEDS_QUOTING = /[",\r\n]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!NEEDS_QUOTING.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(','));
  // A leading BOM makes Excel open UTF-8 correctly on Windows.
  return ['﻿' + header, ...body].join('\r\n');
}

export type ExpenseCsvRow = {
  date: Date;
  description: string;
  category: string;
  paidBy: string;
  amount: number;
  currency: string;
  baseAmount: number;
  baseCurrency: string;
  splitCount: number;
  note: string;
  type: 'Expense' | 'Settlement';
};

export function expenseCsv(
  expenses: readonly ExpenseCsvInput[],
  baseCurrency: string,
  categoryName: (id: string | null) => string,
  memberName: (uid: string) => string,
): string {
  const rows: ExpenseCsvRow[] = expenses.map((e) => ({
    date: e.date,
    description: e.description,
    category: e.categoryId ? categoryName(e.categoryId) : 'Uncategorised',
    paidBy: memberName(e.paidBy),
    amount: toMajor(e.amountMinor, e.currency),
    currency: e.currency,
    baseAmount: toMajor(e.baseAmountMinor, baseCurrency),
    baseCurrency,
    splitCount: Object.keys(e.splits).length,
    note: e.note ?? '',
    type: 'Expense',
  }));

  return toCsv(rows, [
    { header: 'Date', value: (r) => r.date.toISOString().slice(0, 10) },
    { header: 'Type', value: (r) => r.type },
    { header: 'Description', value: (r) => r.description },
    { header: 'Category', value: (r) => r.category },
    { header: 'Paid by', value: (r) => r.paidBy },
    { header: 'Amount', value: (r) => r.amount.toFixed(2) },
    { header: 'Currency', value: (r) => r.currency },
    { header: `Amount (${baseCurrency})`, value: (r) => r.baseAmount.toFixed(2) },
    { header: 'Shared with', value: (r) => r.splitCount },
    { header: 'Note', value: (r) => r.note },
  ]);
}

export type ExpenseCsvInput = {
  date: Date;
  description: string;
  categoryId: string | null;
  paidBy: string;
  amountMinor: number;
  currency: string;
  baseAmountMinor: number;
  splits: Record<string, number>;
  note?: string;
};

export type SettlementCsvInput = {
  date: Date;
  fromUid: string;
  toUid: string;
  baseAmountMinor: number;
  method: string;
  note: string;
};

export function settlementsCsv(
  settlements: readonly SettlementCsvInput[],
  baseCurrency: string,
  memberName: (uid: string) => string,
): string {
  return toCsv(
    settlements.map((s) => ({
      date: s.date,
      from: memberName(s.fromUid),
      to: memberName(s.toUid),
      amount: toMajor(s.baseAmountMinor, baseCurrency),
      currency: baseCurrency,
      method: s.method,
      note: s.note,
    })),
    [
      { header: 'Date', value: (r) => r.date.toISOString().slice(0, 10) },
      { header: 'From', value: (r) => r.from },
      { header: 'To', value: (r) => r.to },
      { header: 'Amount', value: (r) => r.amount.toFixed(2) },
      { header: 'Currency', value: (r) => r.currency },
      { header: 'Method', value: (r) => r.method },
      { header: 'Note', value: (r) => r.note },
    ],
  );
}

export type MemberCsvInput = {
  name: string;
  role: string;
  joined: Date;
  paidMinor: number;
  consumedMinor: number;
  netMinor: number;
};

export function membersCsv(
  members: readonly Member[],
  rows: readonly MemberCsvInput[],
  baseCurrency: string,
): string {
  const nameOf = new Map(members.map((m) => [m.uid, m.displayName]));
  void nameOf;
  return toCsv(
    [...rows].sort((a, b) => b.paidMinor - a.paidMinor),
    [
      { header: 'Member', value: (r) => r.name },
      { header: 'Role', value: (r) => r.role },
      { header: 'Joined', value: (r) => r.joined.toISOString().slice(0, 10) },
      {
        header: `Paid (${baseCurrency})`,
        value: (r) => toMajor(r.paidMinor, baseCurrency).toFixed(2),
      },
      {
        header: `Consumed (${baseCurrency})`,
        value: (r) => toMajor(r.consumedMinor, baseCurrency).toFixed(2),
      },
      { header: 'Net', value: (r) => formatMoney(r.netMinor, baseCurrency, { showPlus: true }) },
    ],
  );
}
