/**
 * Multi-currency conversion.
 *
 * A member may log an expense in their own currency while the household ledger
 * is kept in a single base currency. The person editing thinks in the amount
 * they typed, so the split editor works entirely in that currency; conversion to
 * the base currency happens once, on save.
 *
 * The hard requirement is that the converted splits must still sum to exactly
 * `baseAmountMinor`. Converting each share independently with `Math.round` loses
 * or gains a unit, which would break the ledger, so the leftover is redistributed
 * using the largest-remainder method.
 *
 * Pure functions only.
 */

export type ConversionInput = {
  /** uid -> share in the *entered* currency's minor units. */
  splits: Record<string, number>;
  /** Total as entered, in the entered currency's minor units. */
  amountMinor: number;
  /** Total in the household base currency's minor units. */
  baseAmountMinor: number;
  /** Multiplier from the entered currency to the base currency. */
  fxRate: number;
};

export type ConversionResult = {
  splits: Record<string, number>;
  /** True when the rate was exactly 1 and nothing was recalculated. */
  passthrough: boolean;
  /** How many minor units had to be moved to make the total exact. */
  adjustedUnits: number;
};

/**
 * Convert a set of splits into base currency, keeping the total exact.
 */
export function convertSplitsToBase(input: ConversionInput): ConversionResult {
  const { splits, amountMinor, baseAmountMinor, fxRate } = input;

  const uids = Object.keys(splits);
  if (uids.length === 0) {
    return { splits: {}, passthrough: true, adjustedUnits: 0 };
  }

  // Nothing to do when the rate is 1 or the totals already agree.
  if (fxRate === 1 || amountMinor === baseAmountMinor) {
    const sum = uids.reduce((total, uid) => total + (splits[uid] ?? 0), 0);
    if (sum === baseAmountMinor) {
      return { splits: { ...splits }, passthrough: true, adjustedUnits: 0 };
    }
  }

  // Convert each share, keeping the fractional part so the rounding decision can
  // be made globally rather than per share.
  const exact: number[] = [];
  const floored: number[] = [];
  const fracs: number[] = [];

  for (const uid of uids) {
    const raw = (splits[uid] ?? 0) * fxRate;
    const floor = Math.floor(raw);
    exact.push(raw);
    floored.push(floor);
    fracs.push(raw - floor);
  }

  let assigned = floored.reduce((a, b) => a + b, 0);
  let leftover = baseAmountMinor - assigned;
  const adjustedUnits = leftover;

  // Hand out (or reclaim) the leftover by largest fractional part, so the
  // people who were rounded down hardest absorb the difference.
  const order = uids
    .map((_, index) => index)
    .sort((a, b) => fracs[b] - fracs[a] || a - b);

  let cursor = 0;
  while (leftover > 0 && order.length > 0) {
    floored[order[cursor % order.length]!]! += 1;
    leftover -= 1;
    cursor += 1;
  }
  while (leftover < 0 && order.length > 0) {
    // Reclaiming is only safe from a share that can spare the unit.
    const index = order[cursor % order.length]!;
    if (floored[index]! > 0) {
      floored[index]! -= 1;
      leftover += 1;
    } else {
      // Every remaining candidate is already at zero; move on to the next one.
      const next = order.find((i) => floored[i]! > 0);
      if (next === undefined) break;
      floored[next] -= 1;
      leftover += 1;
    }
    cursor += 1;
  }

  const out: Record<string, number> = {};
  uids.forEach((uid, index) => {
    out[uid] = floored[index]!;
  });

  void exact;

  return { splits: out, passthrough: false, adjustedUnits };
}

/** Split a base-currency total back into the entered currency, for display. */
export function baseToEntered(baseMinor: number, fxRate: number): number {
  if (fxRate <= 0) return baseMinor;
  return Math.round(baseMinor / fxRate);
}

/**
 * Build an exchange rate from two amounts of the same currency pair.
 *
 * There is no rates API in this app on purpose: the household never silently
 * converts money at a rate nobody chose. A rate is either typed in by the person
 * logging the expense or left at 1.
 */
export function rateFromAmounts(baseAmountMinor: number, enteredAmountMinor: number): number {
  if (enteredAmountMinor === 0) return 1;
  return baseAmountMinor / enteredAmountMinor;
}

/** Round a rate to something a person would type, for showing in the UI. */
export function formatRate(rate: number, decimals = 4): string {
  const rounded = Number(rate.toFixed(decimals));
  return String(rounded);
}

/** A plausible default rate so the field is never confusingly blank. */
export function defaultRate(baseCurrency: string, currency: string): number {
  return baseCurrency === currency ? 1 : 1;
}
