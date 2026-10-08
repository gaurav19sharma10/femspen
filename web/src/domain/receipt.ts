/**
 * Receipt parsing.
 *
 * Turns the raw text that on-device OCR produces into the three fields that
 * matter when logging an expense: the total, the date and the merchant name.
 *
 * This is deliberately a pure function over a string. The recognition step is
 * platform code, but every interesting decision — which number is the total,
 * which line is the shop — is ordinary logic that can be tested against
 * labelled fixtures. That is what keeps the accuracy number meaningful.
 *
 * Parsing heuristics, in order of confidence:
 *   1. A line with a strong total keyword (GRAND TOTAL, AMOUNT DUE, ...).
 *   2. A currency-prefixed or bare number on its own line near the bottom.
 *   3. The largest number on the receipt at all.
 */

export type ParsedReceipt = {
  /** Minor units in the given currency, or null when nothing was found. */
  amountMinor: number | null;
  /** ISO `YYYY-MM-DD`, or null. */
  date: string | null;
  /** The merchant line, or null. */
  merchant: string | null;
  /** Every candidate total considered, best first. Useful for the review UI. */
  candidates: number[];
  /** What the parser ended up trusting, for the "we read this" explainer. */
  confidence: 'high' | 'medium' | 'low' | 'none';
};

export type ParseOptions = {
  currency: string;
  decimals: number;
  /** The device's current date, used to sanity-check a parsed year. */
  now?: Date;
};

/** Lines that, when present, almost always hold the amount actually owed. */
const TOTAL_KEYWORDS = [
  'grand total',
  'total amount',
  'amount due',
  'amount payable',
  'balance due',
  'total payable',
  'net payable',
  'total to pay',
  'amount to pay',
  'you pay',
  'amount',
  'total',
];

/** Lines that hold a number that must never be mistaken for the total. */
const DISCOUNT_WORDS = [
  'discount',
  'savings',
  'saved',
  'off',
  'subtotal',
  'sub total',
  'tax',
  'gst',
  'vat',
  'change',
  'cash',
  'card',
  'change due',
  'points',
  'loyalty',
];

const MERCHANT_STOP_WORDS = [
  'receipt',
  'invoice',
  'tax invoice',
  'bill',
  'order',
  'date',
  'time',
  'phone',
  'tel',
  'www.',
  'http',
  'gstin',
  'gst no',
  'thank you',
  'invoice no',
  'bill no',
  'order no',
  'table',
  'server',
  'cashier',
];

/** A line that is really a date, whose digits must not be read as money. */
const DATE_LIKE = /\b\d{1,2}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{2,4}\b|\b\d{1,2}\s+[a-z]{3,9}\.?\s+\d{2,4}\b/i;

const isDateLine = (line: string) => DATE_LIKE.test(line);

const isTotalLine = (line: string) => {
  const lower = line.toLowerCase();
  if (DISCOUNT_WORDS.some((word) => lower.includes(word))) return false;
  return TOTAL_KEYWORDS.some((word) => lower.includes(word));
};

const hasKeyword = (line: string, keyword: string) => line.toLowerCase().includes(keyword);

/** Pull every plausible money value out of a line. */
function numbersIn(line: string, decimals: number): number[] {
  // Matches 1,234.56 / 1234.56 / 1.234,56 / 1234 / 12,00,000
  const pattern = /\d[\d.,]*/g;
  const matches = line.match(pattern);
  if (!matches) return [];

  const out: number[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,](?=\d{3}\b)/g, '');
    // Last separator with 1-2 trailing digits is the decimal mark.
    const normalised = normaliseDecimal(cleaned);
    const value = Number.parseFloat(normalised);
    if (!Number.isFinite(value) || value <= 0) continue;
    out.push(Math.round(value * 10 ** decimals));
  }
  return out;
}

function normaliseDecimal(raw: string): string {
  const lastDot = raw.lastIndexOf('.');
  const lastComma = raw.lastIndexOf(',');

  if (lastDot >= 0 && lastComma >= 0) {
    const dec = Math.max(lastDot, lastComma);
    const whole = raw.slice(0, dec).replace(/[.,]/g, '');
    const fraction = raw.slice(dec + 1).replace(/[.,]/g, '');
    return `${whole}.${fraction}`;
  }

  const sep = lastDot >= 0 ? lastDot : lastComma;
  if (sep < 0) return raw;
  const after = raw.length - sep - 1;
  if (after === 3) {
    // Looks like a thousands separator rather than a decimal mark.
    return raw.replace(/[.,]/g, '');
  }
  const whole = raw.slice(0, sep).replace(/[.,]/g, '');
  const fraction = raw.slice(sep + 1).replace(/[.,]/g, '');
  return fraction ? `${whole}.${fraction}` : `${whole}.`;
}

/** Dates in the formats receipts actually use. */
function parseDateLine(line: string, now: Date): string | null {
  // 12/08/2026, 12-08-26, 12.08.2026
  const numeric = line.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    let year = Number(numeric[3]);
    if (year < 100) year += 2000;

    // Prefer day-first: 13 cannot be a month, and most of the world writes
    // receipts day-first.
    const [day, month] = a > 12 ? [a, b] : b > 12 ? [b, a] : [a, b];

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && isPlausibleYear(year, now)) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  // 12 Aug 2026 / 12 August 2026
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const named = line.toLowerCase().match(/\b(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{2,4})\b/);
  if (named) {
    const day = Number(named[1]);
    const index = months.findIndex((m) => named[2]!.startsWith(m));
    let year = Number(named[3]);
    if (year < 100) year += 2000;
    if (index >= 0 && day >= 1 && day <= 31 && isPlausibleYear(year, now)) {
      return `${year}-${pad(index + 1)}-${pad(day)}`;
    }
  }

  return null;
}

function isPlausibleYear(year: number, now: Date): boolean {
  // Receipts are never dated far in the past or in the future.
  return year >= now.getFullYear() - 12 && year <= now.getFullYear() + 1;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Parse OCR text into an amount, a date and a merchant.
 */
export function parseReceiptText(text: string, options: ParseOptions): ParsedReceipt {
  const { decimals } = options;
  const now = options.now ?? new Date();

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { amountMinor: null, date: null, merchant: null, candidates: [], confidence: 'none' };
  }

  // --- amount, strongest signal first -------------------------------------
  const candidates: number[] = [];

  for (const line of lines) {
    if (!isTotalLine(line)) continue;
    // A total line can hold several numbers; the last is normally the payable.
    const values = numbersIn(line, decimals);
    if (values.length > 0) {
      const best = values[values.length - 1]!;
      if (!candidates.includes(best)) candidates.push(best);
    }
  }

  // Currency-prefixed amounts are a strong hint too.
  for (const line of lines) {
    if (!/[$€£₹¥]|rs\.?|inr|usd/i.test(line)) continue;
    if (DISCOUNT_WORDS.some((word) => line.toLowerCase().includes(word))) continue;
    const values = numbersIn(line, decimals);
    if (values.length > 0) {
      const best = values[values.length - 1]!;
      if (!candidates.includes(best)) candidates.push(best);
    }
  }

  // Bare numbers, kept with their position. Receipts put the total near the
  // bottom, so candidates are tried lowest-line-first.
  const bare: { value: number; index: number }[] = [];
  lines.forEach((line, index) => {
    if (isTotalLine(line)) return;
    if (isDateLine(line)) return;
    if (DISCOUNT_WORDS.some((word) => line.toLowerCase().includes(word))) return;
    if (!/\d/.test(line)) return;
    // A line that is only a number is a clean candidate; mixed lines are noisier.
    if (!/^[\d\s.,]+$/.test(line)) return;
    const values = numbersIn(line, decimals);
    if (values.length > 0 && !bare.some((entry) => entry.value === values[0])) {
      bare.push({ value: values[0]!, index });
    }
  });

  const bareList = bare.sort((a, b) => b.index - a.index).map((entry) => entry.value);

  for (const value of bareList) {
    if (!candidates.includes(value)) candidates.push(value);
  }

  let amountMinor: number | null = null;
  let confidence: ParsedReceipt['confidence'] = 'none';

  const keywordHit = lines.some(isTotalLine);
  if (candidates.length > 0) {
    amountMinor = candidates[0]!;
    if (keywordHit) confidence = 'high';
    else if (bareList.length > 0 && bareList[0] === amountMinor) confidence = 'medium';
    else confidence = 'low';
  }

  // A receipt's largest figure is the last resort.
  if (amountMinor === null) {
    const all = lines
      .filter((line) => !isDateLine(line))
      .flatMap((line) => numbersIn(line, decimals));
    if (all.length > 0) {
      amountMinor = Math.max(...all);
      confidence = 'low';
    }
  }

  // --- date --------------------------------------------------------------
  let date: string | null = null;
  for (const line of lines.slice(0, 12)) {
    if (!hasKeyword(line, 'date') && !/\d{1,2}[/\-.]\d{1,2}[/\-.]/.test(line)) continue;
    date = parseDateLine(line, now);
    if (date) break;
  }
  if (!date) {
    for (const line of lines.slice(0, 12)) {
      date = parseDateLine(line, now);
      if (date) break;
    }
  }

  // --- merchant ----------------------------------------------------------
  // The name is nearly always the first meaningful line: no digits, not a
  // receipt boilerplate word, and not obviously an address or a phone number.
  let merchant: string | null = null;
  for (const line of lines.slice(0, 6)) {
    const lower = line.toLowerCase();
    if (MERCHANT_STOP_WORDS.some((word) => lower.includes(word))) continue;
    if (/\d{4,}/.test(line)) continue;
    if (line.length < 3) continue;
    if (/^[^a-z]*$/i.test(line)) continue;
    merchant = line.replace(/[^\w\s&'.-]/g, '').trim();
    if (merchant && merchant.length >= 3) break;
  }

  return { amountMinor, date, merchant, candidates, confidence };
}
