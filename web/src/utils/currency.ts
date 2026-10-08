export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AU$)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];

export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  try {
    const locale = currencyObj.code === 'INR' ? 'en-IN' : undefined;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyObj.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyObj.symbol}${amount.toLocaleString('en-IN')}`;
  }
}

export function getCurrencySymbol(currencyCode = 'INR'): string {
  const item = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return item ? item.symbol : '₹';
}
