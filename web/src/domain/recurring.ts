/**
 * Recurring expense scheduling.
 *
 * Recurring templates are turned into real expenses on the client, when a member
 * next opens the app, rather than by a Cloud Function — that keeps the project
 * on Firebase's free Spark plan. `dueOccurrences` decides what still needs
 * creating, and `nextOccurrence` walks a template forward.
 *
 * All arithmetic is done on local date components rather than on Date objects so
 * a template created at 23:30 stays on its intended day regardless of the
 * device's timezone offset.
 */

import type { Cadence } from './types';

export type DateParts = { year: number; month: number; day: number };

export function toParts(date: Date): DateParts {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export function fromParts({ year, month, day }: DateParts, time?: { hours: number; minutes: number }): Date {
  return new Date(year, month, day, time?.hours ?? 9, time?.minutes ?? 0, 0, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  const pa = toParts(a);
  const pb = toParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

export function addDays(date: Date, days: number): Date {
  const p = toParts(date);
  return fromParts({ ...p, day: p.day + days });
}

/**
 * Add months, clamping to the last valid day so that adding one month to
 * 31 January lands on 28/29 February rather than rolling into March.
 */
export function addMonths(date: Date, months: number): Date {
  const p = toParts(date);
  const targetMonth = p.month + months;
  const probe = new Date(p.year, targetMonth, 1);
  const lastDay = new Date(probe.getFullYear(), probe.getMonth() + 1, 0).getDate();
  return fromParts({
    year: probe.getFullYear(),
    month: probe.getMonth(),
    day: Math.min(p.day, lastDay),
  });
}

export function addYears(date: Date, years: number): Date {
  const p = toParts(date);
  const lastDay = new Date(p.year + years, p.month + 1, 0).getDate();
  return fromParts({ year: p.year + years, month: p.month, day: Math.min(p.day, lastDay) });
}

/**
 * The first occurrence of a template that is strictly on or after `from`.
 *
 * Walks forward from the template's start date. Templates are created at a daily
 * or weekly cadence at most, so even a start date years ago stays cheap to walk;
 * the `MAX_STEPS` guard exists so a bad `startAt` can never hang the app.
 */
export function nextOccurrence(
  startAt: Date,
  cadence: Cadence,
  interval: number,
  from: Date,
): Date | null {
  const step = Math.max(1, Math.floor(interval) || 1);
  const MAX_STEPS = 5000;

  let candidate = fromParts(toParts(startAt));

  for (let i = 0; i < MAX_STEPS; i += 1) {
    if (candidate.getTime() >= startOfDay(from).getTime()) return candidate;
    switch (cadence) {
      case 'daily':
        candidate = addDays(candidate, step);
        break;
      case 'weekly':
        candidate = addDays(candidate, 7 * step);
        break;
      case 'monthly':
        candidate = addMonths(candidate, step);
        break;
      case 'yearly':
        candidate = addYears(candidate, step);
        break;
      default:
        return null;
    }
  }

  return null;
}

/** Advance a template to the occurrence after `date`. */
export function advance(
  date: Date,
  cadence: Cadence,
  interval: number,
): Date {
  const step = Math.max(1, Math.floor(interval) || 1);
  switch (cadence) {
    case 'daily':
      return addDays(date, step);
    case 'weekly':
      return addDays(date, 7 * step);
    case 'monthly':
      return addMonths(date, step);
    case 'yearly':
      return addYears(date, step);
    default:
      return addDays(date, step);
  }
}

function startOfDay(date: Date): Date {
  const p = toParts(date);
  return new Date(p.year, p.month, p.day);
}

/**
 * Every occurrence a template owes between `from` and `to`, capped so that a
 * phone that has not been opened for a year cannot try to write hundreds of rows
 * in one go. The rest stay pending and come through on a later open.
 */
export function dueOccurrences(
  startAt: Date,
  cadence: Cadence,
  interval: number,
  from: Date,
  to: Date,
  limit = 12,
): Date[] {
  const out: Date[] = [];
  // Compare on calendar days, not on timestamps: an occurrence carries a
  // generated time of day, so comparing it against a start-of-day cutoff would
  // silently drop anything due today.
  const upper = startOfDay(to).getTime();
  let cursor = nextOccurrence(startAt, cadence, interval, from);
  let guard = 0;

  while (cursor && startOfDay(cursor).getTime() <= upper && out.length < limit && guard < 1000) {
    out.push(cursor);
    cursor = advance(cursor, cadence, interval);
    guard += 1;
  }

  return out;
}

/** A short human description of a cadence, e.g. "every 2 weeks". */
export function describeCadence(cadence: Cadence, interval: number): string {
  const n = Math.max(1, Math.floor(interval) || 1);
  const unit =
    cadence === 'daily' ? 'day' : cadence === 'weekly' ? 'week' : cadence === 'monthly' ? 'month' : 'year';
  const plural = n === 1 ? '' : 's';
  if (n === 1) return `Every ${unit}`;
  return `Every ${n} ${unit}${plural}`;
}
