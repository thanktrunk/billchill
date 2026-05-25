import { describe, expect, it } from 'vitest'
import { currencySymbol, formatCurrency, formatCurrencyShort, formatDate, suggestedAmounts } from './currency'

describe('currencySymbol', () => {
  it.each([
    ['USD', '$'],
    ['EUR', '€'],
    ['GBP', '£'],
    ['JPY', '¥'],
    ['VND', '₫'],
    ['AUD', 'A$'],
    ['CAD', 'C$'],
    ['SGD', 'S$'],
  ])('returns correct symbol for %s', (code, expected) => {
    expect(currencySymbol(code)).toBe(expected)
  })

  it('returns the raw code for an unknown currency', () => {
    expect(currencySymbol('XYZ')).toBe('XYZ')
  })
})

describe('formatCurrency', () => {
  it('formats USD with dollar sign and 2 decimal places', () => {
    expect(formatCurrency(10, 'USD')).toBe('$10.00')
  })

  it('formats JPY with no decimal places', () => {
    const result = formatCurrency(1000, 'JPY')
    expect(result).toContain('1,000')
    expect(result).not.toMatch(/\.\d/)
  })

  it('formats VND with no decimal places and trailing symbol', () => {
    const result = formatCurrency(50000, 'VND')
    expect(result).toContain('₫')
    expect(result).toContain('50')
  })

  it('parses string input correctly', () => {
    expect(formatCurrency('15.50', 'USD')).toBe('$15.50')
  })

  it('renders NaN input as 0', () => {
    expect(formatCurrency(NaN, 'USD')).toBe('$0.00')
  })

  it('falls back to plain number + label for a non-ISO code', () => {
    const result = formatCurrency(100, 'CUSTOM')
    expect(result).toContain('100')
    expect(result).toContain('CUSTOM')
  })
})

describe('formatCurrencyShort', () => {
  it('delegates to formatCurrency for values below 1,000', () => {
    expect(formatCurrencyShort(50, 'USD')).toBe('$50.00')
  })

  it('abbreviates thousands with K suffix', () => {
    expect(formatCurrencyShort(1500, 'USD')).toBe('$1.50K')
  })

  it('abbreviates millions with M suffix', () => {
    expect(formatCurrencyShort(2_000_000, 'USD')).toBe('$2.00M')
  })

  it('prepends minus sign for negative values', () => {
    expect(formatCurrencyShort(-1500, 'USD')).toBe('-$1.50K')
  })

  it('places the symbol after the amount for VND (trailing-symbol currency)', () => {
    const result = formatCurrencyShort(2_000_000, 'VND')
    const symbolIndex = result.indexOf('₫')
    const digitIndex = result.search(/\d/)
    expect(symbolIndex).toBeGreaterThan(digitIndex)
  })
})

describe('formatDate', () => {
  it('formats date in English locale for lang en', () => {
    const result = formatDate('2024-06-15T00:00:00Z', 'en')
    expect(result).toMatch(/Jun/)
  })

  it('formats date in Vietnamese locale for lang vi', () => {
    const result = formatDate('2024-06-15T00:00:00Z', 'vi')
    expect(result).toMatch(/6/)
  })

  it('respects custom Intl.DateTimeFormatOptions', () => {
    const result = formatDate('2024-06-15T00:00:00Z', 'en', { year: 'numeric', month: 'long', day: 'numeric' })
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/June/)
  })
})

describe('suggestedAmounts', () => {
  it.each([
    ['USD', [5, 10, 20, 50]],
    ['EUR', [5, 10, 20, 50]],
    ['JPY', [500, 1000, 2000, 5000]],
    ['VND', [50000, 100000, 200000, 500000, 1000000]],
  ])('returns correct amounts for %s', (code, expected) => {
    expect(suggestedAmounts(code)).toEqual(expected)
  })

  it('returns fallback amounts for an unknown currency', () => {
    expect(suggestedAmounts('XYZ')).toEqual([10, 20, 50, 100])
  })
})
