export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'VND', 'AUD', 'CAD', 'SGD'] as const

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

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'VND'])

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

const SUGGESTED_AMOUNTS: Record<string, number[]> = {
  USD: [5, 10, 20, 50],
  EUR: [5, 10, 20, 50],
  GBP: [5, 10, 20, 50],
  JPY: [500, 1000, 2000, 5000],
  VND: [50000, 100000, 200000, 500000, 1000000],
  AUD: [5, 10, 20, 50],
  CAD: [5, 10, 20, 50],
  SGD: [5, 10, 20, 50],
}

export function suggestedAmounts(code: string): number[] {
  return SUGGESTED_AMOUNTS[code] ?? [10, 20, 50, 100]
}

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatCurrency(amount: number | string, currencyCode: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const safeNum = Number.isFinite(num) ? num : 0
  const rawCode = currencyCode.trim()
  const normalizedCode = rawCode.toUpperCase()
  const locale = CURRENCY_LOCALES[normalizedCode] ?? 'en-US'

  if (/^[A-Z]{3}$/.test(normalizedCode)) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalizedCode,
        ...(ZERO_DECIMAL_CURRENCIES.has(normalizedCode) && { maximumFractionDigits: 0, minimumFractionDigits: 0 }),
      }).format(safeNum)
    } catch {
      // Fall back to plain number formatting for custom/non-ISO labels.
    }
  }

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeNum)

  return rawCode ? `${formattedNumber} ${rawCode}` : formattedNumber
}

export function formatDate(iso: string, lang: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const locale = LANG_LOCALES[lang] ?? 'en-US'
  return new Date(iso).toLocaleDateString(locale, options)
}
