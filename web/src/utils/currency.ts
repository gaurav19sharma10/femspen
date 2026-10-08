export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AU$)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
];

export function formatCurrency(amount: number, currencyCode = 'USD'): string {
  const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyObj.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyObj.symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode = 'USD'): string {
  const item = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return item ? item.symbol : '$';
}
