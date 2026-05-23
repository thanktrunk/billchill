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

const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  VND: 'vi-VN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
}

const LANG_LOCALES: Record<string, string> = {
  en: 'en-US',
  vi: 'vi-VN',
}

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatCurrency(amount: number | string, currencyCode: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const locale = CURRENCY_LOCALES[currencyCode] ?? 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(num)
}

export function formatDate(iso: string, lang: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const locale = LANG_LOCALES[lang] ?? 'en-US'
  return new Date(iso).toLocaleDateString(locale, options)
}
