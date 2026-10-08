/**
 * Split allocation.
 *
 * An expense's splits must sum *exactly* to the expense amount, in integer
 * minor units, or the ledger does not balance. This module is the single place
 * that guarantee is produced, for all four split modes, with no floating point
 * left over at the end.
 *
 * Pure functions only: no React, no Firebase, no dates. Fully unit tested.
 */

export type SplitMode = 'equal' | 'percent' | 'weight' | 'exact';

export const SPLIT_MODES: readonly SplitMode[] = ['equal', 'percent', 'weight', 'exact'];

export type SplitParticipant = {
  uid: string;
  /**
   * Meaning depends on the mode:
   * - `equal`   : ignored
   * - `percent` : 0-100, must total 100
   * - `weight`  : > 0, relative to the others
   * - `exact`   : an exact amount in minor units
   */
  value?: number;
};

export type SplitIssueCode =
  | 'NO_PARTICIPANTS'
  | 'DUPLICATE_PARTICIPANT'
  | 'INVALID_AMOUNT'
  | 'PERCENT_OUT_OF_RANGE'
  | 'PERCENT_TOTAL'
  | 'WEIGHT_INVALID'
  | 'EXACT_EXCEEDS'
  | 'EXACT_MISMATCH';

export type SplitIssue = {
  code: SplitIssueCode;
  message: string;
  /** Present when the problem is attributable to one person. */
  uid?: string;
};

export type AllocationResult = {
  /** uid -> amount in minor units. Always sums to `amount` on success. */
  splits: Record<string, number>;
  /** Sum of `splits`. */
  allocated: number;
  /** `amount - allocated`. Non-zero only when `errors` is non-empty. */
  remainder: number;
  errors: SplitIssue[];
  ok: boolean;
};

/** Percent totals are compared with tolerance because users type 33.3 three times. */
const PERCENT_EPSILON = 0.05;

const fail = (issues: SplitIssue[]): AllocationResult => ({
  splits: {},
  allocated: 0,
  remainder: 0,
  errors: issues,
  ok: false,
});

/**
 * Allocate `amount` minor units across `participants` according to `mode`.
 *
 * On success `splits` sums to exactly `amount` and `errors` is empty. On failure
 * nothing is allocated, so a caller can never accidentally persist a partial
 * split.
 */
export function allocateSplit(
  amount: number,
  participants: readonly SplitParticipant[],
  mode: SplitMode,
): AllocationResult {
  if (!Number.isInteger(amount) || amount <= 0) {
    return fail([{ code: 'INVALID_AMOUNT', message: 'Amount must be a positive whole number of paise.' }]);
  }

  if (participants.length === 0) {
    return fail([{ code: 'NO_PARTICIPANTS', message: 'Pick at least one person to split with.' }]);
  }

  const seen = new Set<string>();
  for (const p of participants) {
    if (seen.has(p.uid)) {
      return fail([
        { code: 'DUPLICATE_PARTICIPANT', message: 'Someone is listed twice.', uid: p.uid },
      ]);
    }
    seen.add(p.uid);
  }

  switch (mode) {
    case 'equal':
      return allocateEqual(amount, participants);
    case 'percent':
      return allocateByRatio(amount, participants, 'percent');
    case 'weight':
      return allocateByRatio(amount, participants, 'weight');
    case 'exact':
      return allocateExact(amount, participants);
    default: {
      const exhaustive: never = mode;
      return fail([
        { code: 'INVALID_AMOUNT', message: `Unknown split mode: ${String(exhaustive)}` },
      ]);
    }
  }
}

function allocateEqual(amount: number, participants: readonly SplitParticipant[]): AllocationResult {
  const n = participants.length;
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;

  const splits: Record<string, number> = {};
  participants.forEach((p, index) => {
    // The first `remainder` people each take one extra minor unit, so the total
    // is exact and the result is stable for a given input order.
    splits[p.uid] = index < remainder ? base + 1 : base;
  });

  return { splits, allocated: amount, remainder: 0, errors: [], ok: true };
}

/**
 * Proportional allocation using the largest-remainder method.
 *
 * Flooring each share leaves a few minor units unassigned; those are handed out
 * one each to whoever was rounded down hardest. This is the standard fair
 * apportionment approach and avoids the systematic bias of naive rounding.
 */
function allocateByRatio(
  amount: number,
  participants: readonly SplitParticipant[],
  kind: 'percent' | 'weight',
): AllocationResult {
  const values = participants.map((p) => p.value ?? 0);

  if (kind === 'percent') {
    for (const p of participants) {
      const v = p.value ?? 0;
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        return fail([
          {
            code: 'PERCENT_OUT_OF_RANGE',
            message: 'Each percentage must be between 0 and 100.',
            uid: p.uid,
          },
        ]);
      }
    }
    const total = values.reduce((a, b) => a + b, 0);
    if (Math.abs(total - 100) > PERCENT_EPSILON) {
      return fail([
        {
          code: 'PERCENT_TOTAL',
          message: `Percentages must add up to 100 (currently ${round2(total)}).`,
        },
      ]);
    }
  } else {
    let total = 0;
    for (const p of participants) {
      const v = p.value ?? 0;
      if (!Number.isFinite(v) || v < 0) {
        return fail([
          { code: 'WEIGHT_INVALID', message: 'Weights cannot be negative.', uid: p.uid },
        ]);
      }
      total += v;
    }
    if (total <= 0) {
      return fail([{ code: 'WEIGHT_INVALID', message: 'At least one weight must be greater than 0.' }]);
    }
  }

  const total = values.reduce((a, b) => a + b, 0);

  const floors: number[] = [];
  const fracs: number[] = [];
  let assigned = 0;

  for (const v of values) {
    const raw = (amount * v) / total;
    const floor = Math.floor(raw);
    floors.push(floor);
    fracs.push(raw - floor);
    assigned += floor;
  }

  let leftover = amount - assigned;

  // Rank by fractional part, highest first. Ties break on original order so the
  // result stays deterministic.
  const order = participants
    .map((_, i) => i)
    .sort((a, b) => fracs[b] - fracs[a] || a - b);

  for (const index of order) {
    if (leftover <= 0) break;
    floors[index] += 1;
    leftover -= 1;
  }

  const splits: Record<string, number> = {};
  participants.forEach((p, i) => {
    splits[p.uid] = floors[i];
  });

  return { splits, allocated: amount, remainder: 0, errors: [], ok: true };
}

function allocateExact(
  amount: number,
  participants: readonly SplitParticipant[],
): AllocationResult {
  const splits: Record<string, number> = {};
  let total = 0;

  for (const p of participants) {
    const v = p.value ?? 0;
    if (!Number.isInteger(v) || v < 0) {
      return fail([
        { code: 'INVALID_AMOUNT', message: 'Each share must be a whole number of paise.', uid: p.uid },
      ]);
    }
    splits[p.uid] = v;
    total += v;
  }

  if (total > amount) {
    return fail([
      {
        code: 'EXACT_EXCEEDS',
        message: `Shares add up to more than the total (${total} > ${amount} minor units).`,
      },
    ]);
  }

  if (total < amount) {
    return fail([
      {
        code: 'EXACT_MISMATCH',
        message: `Shares are ${amount - total} minor units short of the total.`,
      },
    ]);
  }

  return { splits, allocated: total, remainder: 0, errors: [], ok: true };
}

/**
 * Repair an exact split that falls short by handing the leftover to `fallbackUid`.
 * The split editor calls this when the user taps "put the rest on me" instead of
 * making them do arithmetic.
 */
export function absorbRemainder(
  splits: Record<string, number>,
  amount: number,
  fallbackUid: string,
): Record<string, number> {
  const next = { ...splits };
  const allocated = Object.values(next).reduce((a, b) => a + b, 0);
  const leftover = amount - allocated;
  if (leftover === 0) return next;
  if (leftover < 0) return next;
  next[fallbackUid] = (next[fallbackUid] ?? 0) + leftover;
  return next;
}

export type SplitInput = {
  mode: SplitMode;
  participantIds: string[];
  /**
   * The per-person input for the active mode:
   * - `equal`   : ignored
   * - `percent` : 0-100
   * - `weight`  : relative
   * - `exact`   : the amount in minor units
   */
  values: Record<string, number>;
};

export type DerivedSplit = {
  splits: Record<string, number>;
  errors: SplitIssue[];
  ok: boolean;
};

/**
 * Turn the editor's mode and per-person inputs into an exact allocation.
 *
 * This is the single definition of "what the split editor currently means", and
 * it is a pure function so the behaviour of all four modes can be tested
 * without rendering anything.
 */
export function deriveSplits(amountMinor: number, input: SplitInput): DerivedSplit {
  const { mode, values } = input;

  // Drop blanks and repeats, keeping the first occurrence, so a stale
  // participant list cannot cause the same person to be counted twice.
  const uids: string[] = [];
  for (const uid of input.participantIds) {
    if (typeof uid !== 'string' || uid.length === 0) continue;
    if (uids.includes(uid)) continue;
    uids.push(uid);
  }

  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    return { splits: {}, errors: [{ code: 'INVALID_AMOUNT', message: 'Enter an amount first.' }], ok: false };
  }
  if (uids.length === 0) {
    return { splits: {}, errors: [{ code: 'NO_PARTICIPANTS', message: 'Pick at least one person to split with.' }], ok: false };
  }

  if (mode === 'exact') {
    const result = allocateSplit(
      amountMinor,
      uids.map((uid) => ({ uid, value: values[uid] ?? 0 })),
      'exact',
    );
    return { splits: result.splits, errors: result.errors, ok: result.ok };
  }

  const participants: SplitParticipant[] =
    mode === 'equal' ? uids.map((uid) => ({ uid })) : uids.map((uid) => ({ uid, value: values[uid] ?? 0 }));

  const result = allocateSplit(amountMinor, participants, mode);
  return { splits: result.splits, errors: result.errors, ok: result.ok };
}

/** Seed the inputs for a mode when switching into it from another. */
export function seedValuesForMode(
  mode: SplitMode,
  participantIds: readonly string[],
  previousSplits: Record<string, number>,
): Record<string, number> {
  if (mode === 'percent') {
    const percents = splitsToPercents(previousSplits, participantIds);
    // `splitsToPercents` can leave a rounding gap; put it on the last person so
    // the total lands on exactly 100 and the editor starts balanced.
    const keys = Object.keys(percents);
    const total = keys.reduce((sum, key) => sum + percents[key]!, 0);
    const last = keys[keys.length - 1];
    if (last && total !== 100) percents[last] = round2(percents[last]! + (100 - total));
    return percents;
  }

  if (mode === 'weight') return splitsToWeights(previousSplits, participantIds);

  if (mode === 'exact') {
    return participantIds.reduce<Record<string, number>>((acc, uid) => {
      acc[uid] = previousSplits[uid] ?? 0;
      return acc;
    }, {});
  }

  // Equal mode carries no inputs of its own.
  return participantIds.reduce<Record<string, number>>((acc, uid) => {
    acc[uid] = 1;
    return acc;
  }, {});
}

export function sumSplits(splits: Record<string, number>): number {
  return Object.values(splits).reduce((a, b) => a + b, 0);
}

/**
 * Seed an exact-mode editor from a total. Equal by default; the user then edits
 * individual numbers and the remainder is tracked for them.
 */
export function seedEqualSplits(
  amount: number,
  uids: readonly string[],
): Record<string, number> {
  return allocateEqual(amount, uids.map((uid) => ({ uid }))).splits;
}

/** Turn a set of amounts into percentages, for switching an editor between modes. */
export function splitsToPercents(
  splits: Record<string, number>,
  uids: readonly string[],
): Record<string, number> {
  const total = sumSplits(splits);
  if (total <= 0) return Object.fromEntries(uids.map((uid) => [uid, 0]));
  const out: Record<string, number> = {};
  for (const uid of uids) {
    out[uid] = round2(((splits[uid] ?? 0) / total) * 100);
  }
  return out;
}

/** Turn a set of amounts into integer weights proportional to those amounts. */
export function splitsToWeights(
  splits: Record<string, number>,
  uids: readonly string[],
): Record<string, number> {
  const total = sumSplits(splits);
  if (total <= 0) return Object.fromEntries(uids.map((uid) => [uid, 1]));
  // Scale so the largest share lands on a readable integer.
  const scale = 100 / total;
  return Object.fromEntries(uids.map((uid) => [uid, Math.max(1, Math.round((splits[uid] ?? 0) * scale))]));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
