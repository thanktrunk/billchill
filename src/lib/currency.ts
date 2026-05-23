const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  VND: '₫',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
}

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code
}
