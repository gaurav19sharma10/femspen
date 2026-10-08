/**
 * Currency metadata and safe conversion between "major" units (what humans type,
 * e.g. 12.50) and "minor" units (what we store and do arithmetic on, e.g. 1250).
 *
 * Everything in the ledger is an integer count of minor units. Floating point is
 * only ever used at the very edge — parsing what the user typed and formatting it
 * back for display.
 */

export type CurrencyCode = string;

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  /** Number of decimal places. Zero-decimal currencies (JPY, KRW) matter here. */
  decimals: number;
  name: string;
  /** Emoji flag for the country picker. */
  flag: string;
};

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  INR: { code: 'INR', symbol: '₹', decimals: 2, name: 'Indian Rupee', flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', decimals: 2, name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, name: 'Euro', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, name: 'British Pound', flag: '🇬🇧' },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, name: 'Japanese Yen', flag: '🇯🇵' },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', decimals: 2, name: 'Canadian Dollar', flag: '🇨🇦' },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2, name: 'Singapore Dollar', flag: '🇸🇬' },
  AED: { code: 'AED', symbol: 'AED', decimals: 2, name: 'UAE Dirham', flag: '🇦🇪' },
  ZAR: { code: 'ZAR', symbol: 'R', decimals: 2, name: 'South African Rand', flag: '🇿🇦' },
  NGN: { code: 'NGN', symbol: '₦', decimals: 2, name: 'Nigerian Naira', flag: '🇳🇬' },
  KES: { code: 'KES', symbol: 'KSh', decimals: 2, name: 'Kenyan Shilling', flag: '🇰🇪' },
  BRL: { code: 'BRL', symbol: 'R$', decimals: 2, name: 'Brazilian Real', flag: '🇧🇷' },
  MXN: { code: 'MXN', symbol: 'MX$', decimals: 2, name: 'Mexican Peso', flag: '🇲🇽' },
  CHF: { code: 'CHF', symbol: 'CHF', decimals: 2, name: 'Swiss Franc', flag: '🇨🇭' },
  MYR: { code: 'MYR', symbol: 'RM', decimals: 2, name: 'Malaysian Ringgit', flag: '🇲🇾' },
  PKR: { code: 'PKR', symbol: '₨', decimals: 2, name: 'Pakistani Rupee', flag: '🇵🇰' },
  BDT: { code: 'BDT', symbol: '৳', decimals: 2, name: 'Bangladeshi Taka', flag: '🇧🇩' },
  LKR: { code: 'LKR', symbol: 'Rs', decimals: 2, name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  IDR: { code: 'IDR', symbol: 'Rp', decimals: 0, name: 'Indonesian Rupiah', flag: '🇮🇩' },
  PHP: { code: 'PHP', symbol: '₱', decimals: 2, name: 'Philippine Peso', flag: '🇵🇭' },
  THB: { code: 'THB', symbol: '฿', decimals: 2, name: 'Thai Baht', flag: '🇹🇭' },
  VND: { code: 'VND', symbol: '₫', decimals: 0, name: 'Vietnamese Dong', flag: '🇻🇳' },
  TRY: { code: 'TRY', symbol: '₺', decimals: 2, name: 'Turkish Lira', flag: '🇹🇷' },
  SEK: { code: 'SEK', symbol: 'kr', decimals: 2, name: 'Swedish Krona', flag: '🇸🇪' },
  NZD: { code: 'NZD', symbol: 'NZ$', decimals: 2, name: 'New Zealand Dollar', flag: '🇳🇿' },
};

export const FALLBACK_CURRENCY: Currency = CURRENCIES.INR;

export function getCurrency(code: CurrencyCode | null | undefined): Currency {
  if (!code) return FALLBACK_CURRENCY;
  return CURRENCIES[code] ?? FALLBACK_CURRENCY;
}

export function currencyDecimals(code: CurrencyCode | null | undefined): number {
  return getCurrency(code).decimals;
}

export function toMinorFactor(code: CurrencyCode | null | undefined): number {
  return 10 ** getCurrency(code).decimals;
}

/** Minor units -> a plain number of major units. Display only. */
export function toMajor(minor: number, code: CurrencyCode = 'INR'): number {
  return minor / toMinorFactor(code);
}

/** A plain number of major units -> minor units. Display/parse only. */
export function fromMajor(major: number, code: CurrencyCode = 'INR'): number {
  return Math.round(major * toMinorFactor(code));
}

/**
 * Parse whatever the user typed into minor units.
 *
 * Tolerates currency symbols, grouping separators, spaces, stray non-numeric
 * characters, and both `.` and `,` as the decimal mark. Returns `null` when the
 * input cannot be read as a positive number.
 *
 * The conversion is done on the digit string, not via `Number()`, so
 * `parseAmountToMinor('0.1', 'INR') + parseAmountToMinor('0.2', 'INR')` is
 * exactly `parseAmountToMinor('0.3', 'INR')` with no float drift.
 */
export function parseAmountToMinor(
  input: string,
  code: CurrencyCode = 'INR',
): number | null {
  if (typeof input !== 'string') return null;

  const negatives = (input.match(/-/g) ?? []).length;
  // Keep digits plus the separators we need to work out which is the decimal mark.
  const cleaned = input.replace(/[^\d.,]/g, '');
  if (cleaned.length === 0) return null;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  let decimalIndex = -1;

  if (lastDot >= 0 && lastComma >= 0) {
    // Whichever appears last is the decimal mark.
    decimalIndex = Math.max(lastDot, lastComma);
  } else if (lastDot >= 0) {
    const after = cleaned.length - lastDot - 1;
    // A single trailing dot, or 1-2 digits after it, reads as a decimal point.
    decimalIndex = after > 0 && after <= 3 ? lastDot : -1;
  } else if (lastComma >= 0) {
    const after = cleaned.length - lastComma - 1;
    decimalIndex = after > 0 && after <= 3 ? lastComma : -1;
  }

  let whole: string;
  let fraction = '';

  if (decimalIndex >= 0) {
    whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, '');
    fraction = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, '');
  } else {
    whole = cleaned.replace(/[.,]/g, '');
    fraction = '';
  }

  if (whole.length === 0 && fraction.length === 0) return null;

  const decimals = getCurrency(code).decimals;
  // Truncate rather than round so 1.999 never becomes 2.00 in a text field.
  fraction = fraction.slice(0, decimals).padEnd(decimals, '0');

  const digits = `${whole || '0'}${fraction}`;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return null;

  return negatives % 2 === 1 ? -value : value;
}

/**
 * Format minor units for display.
 *
 * `compact` switches to the Indian/US short scale (1.2L, 12.3K) which is how
 * people actually talk about large household numbers.
 */
export function formatMoney(
  minor: number,
  code: CurrencyCode = 'INR',
  options: {
    /** Omit the currency symbol, for when it is already in the heading. */
    bare?: boolean;
    /** Always show the +/- sign. Used for balances. */
    signed?: boolean;
    compact?: boolean;
    /** Force a leading + on positive values. */
    showPlus?: boolean;
  } = {},
): string {
  const { bare = false, signed = false, compact = false, showPlus = false } = options;
  const currency = getCurrency(code);
  const negative = minor < 0;
  const abs = Math.abs(minor);

  let body: string;

  if (compact && abs >= 100000) {
    body = formatIndianCompact(abs, currency.decimals);
  } else {
    const major = abs / 10 ** currency.decimals;
    body = groupDigits(major, currency.decimals, code);
  }

  let sign = '';
  if (negative) sign = '−'; // U+2212 minus, aligns with digits better than a hyphen
  else if (signed || showPlus) sign = '+';

  return `${sign}${bare ? '' : currency.symbol}${body}`;
}

/** Indian short scale: 1,00,000 -> 1L, 1,00,00,000 -> 1Cr. */
function formatIndianCompact(minor: number, decimals: number): string {
  const major = minor / 10 ** decimals;
  if (major >= 1e7) return `${trim(major / 1e7, 2)}Cr`;
  if (major >= 1e5) return `${trim(major / 1e5, 2)}L`;
  if (major >= 1e3) return `${trim(major / 1e3, 1)}K`;
  return groupDigits(major, decimals, 'INR');
}

function trim(value: number, places: number): string {
  return value.toFixed(places).replace(/\.?0+$/, '');
}

function groupDigits(major: number, decimals: number, code: CurrencyCode): string {
  const fixed = Math.abs(major).toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = groupForCurrency(whole ?? '0', code);
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/**
 * Group thousands the way the currency's home country does: Indian numbering
 * uses the lakh/crore pattern (12,34,567), everyone else uses 1,234,567.
 */
export function groupIndianOrWestern(
  digits: string,
  style: 'indian' | 'western' = 'western',
): string {
  if (style === 'western') {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  // Indian numbering: the last group is three digits, every group before it is
  // two, and the leftmost group is whatever is left over (1 or 2 digits).
  // 1234567 -> 12,34,567
  if (digits.length <= 3) return digits;

  const groups: string[] = [];
  groups.unshift(digits.slice(-3));
  let rest = digits.slice(0, -3);
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) groups.unshift(rest);

  return groups.join(',');
}

export function groupForCurrency(digits: string, code: CurrencyCode = 'INR'): string {
  const indian = ['INR', 'BDT', 'LKR', 'NPR', 'PKR'].includes(code);
  return groupIndianOrWestern(digits, indian ? 'indian' : 'western');
}

export type CurrencyOption = { code: CurrencyCode; label: string; flag: string; symbol: string };

export function currencyOptions(): CurrencyOption[] {
  return Object.values(CURRENCIES).map((c) => ({
    code: c.code,
    label: `${c.flag}  ${c.code} — ${c.name}`,
    flag: c.flag,
    symbol: c.symbol,
  }));
}
