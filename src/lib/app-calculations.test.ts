import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppCalculations } from './app-calculations'

describe('AppCalculations.buildExpenseSplitsByExpenseId', () => {
  it('returns an empty map for empty splits', () => {
    expect(AppCalculations.buildExpenseSplitsByExpenseId([])).toEqual(new Map())
  })

  it('groups multiple splits under the same expense ID', () => {
    const splits = [
      { expenseId: 'e1', memberId: 'a', shareAmount: '5' },
      { expenseId: 'e1', memberId: 'b', shareAmount: '5' },
    ]
    const result = AppCalculations.buildExpenseSplitsByExpenseId(splits)
    expect(result.get('e1')).toHaveLength(2)
  })

  it('creates separate map entries for distinct expense IDs', () => {
    const splits = [
      { expenseId: 'e1', memberId: 'a', shareAmount: '5' },
      { expenseId: 'e2', memberId: 'b', shareAmount: '10' },
    ]
    const result = AppCalculations.buildExpenseSplitsByExpenseId(splits)
    expect(result.size).toBe(2)
  })
})

describe('AppCalculations.buildExpensesWithSplits', () => {
  it('returns an empty splits array for an expense with no matching splits', () => {
    const result = AppCalculations.buildExpensesWithSplits([{ id: 'e1', paidBy: 'a' }], [])
    expect(result[0].splits).toEqual([])
  })

  it('correctly associates splits with their expense', () => {
    const expenses = [{ id: 'e1', paidBy: 'a' }]
    const splits = [{ expenseId: 'e1', memberId: 'b', shareAmount: '10' }]
    const result = AppCalculations.buildExpensesWithSplits(expenses, splits)
    expect(result[0].splits).toEqual([{ memberId: 'b', shareAmount: '10' }])
  })
})

describe('AppCalculations.calculateGroupBalances', () => {
  it('returns correct balances by integrating expense splits and calculateBalances', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [{ id: 'e1', paidBy: 'a' }]
    const splits = [{ expenseId: 'e1', memberId: 'b', shareAmount: '10' }]
    const result = AppCalculations.calculateGroupBalances(members, expenses, splits)
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(10)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(-10)
  })
})

describe('AppCalculations.getMyBalance', () => {
  const balances = [
    { memberId: 'a', displayName: 'Alice', balance: 10 },
    { memberId: 'b', displayName: 'Bob', balance: -5 },
  ]

  it('returns the balance for the matching member', () => {
    expect(AppCalculations.getMyBalance(balances, 'a')).toBe(10)
  })

  it('returns 0 when myMemberId is null', () => {
    expect(AppCalculations.getMyBalance(balances, null)).toBe(0)
  })

  it('returns 0 when myMemberId is undefined', () => {
    expect(AppCalculations.getMyBalance(balances, undefined)).toBe(0)
  })

  it('returns 0 when the member is not found', () => {
    expect(AppCalculations.getMyBalance(balances, 'z')).toBe(0)
  })
})

describe('AppCalculations.summarizeMyBalances', () => {
  it('sums only positive balances into totalOwed', () => {
    const rows = [{ myBalance: 10 }, { myBalance: -5 }, { myBalance: 20 }]
    expect(AppCalculations.summarizeMyBalances(rows).totalOwed).toBe(30)
  })

  it('sums absolute values of negative balances into totalOwe', () => {
    const rows = [{ myBalance: 10 }, { myBalance: -5 }, { myBalance: -3 }]
    expect(AppCalculations.summarizeMyBalances(rows).totalOwe).toBe(8)
  })

  it('sets netBalance to totalOwed minus totalOwe', () => {
    const { netBalance } = AppCalculations.summarizeMyBalances([{ myBalance: 10 }, { myBalance: -3 }])
    expect(netBalance).toBe(7)
  })
})

describe('AppCalculations.getBalanceFlags', () => {
  it('isOwed is true when balance is above epsilon (0.005)', () => {
    expect(AppCalculations.getBalanceFlags(0.01).isOwed).toBe(true)
  })

  it('isOwing is true when balance is below negative epsilon', () => {
    expect(AppCalculations.getBalanceFlags(-0.01).isOwing).toBe(true)
  })

  it('isSettled is true when balance is within epsilon of zero', () => {
    expect(AppCalculations.getBalanceFlags(0.004).isSettled).toBe(true)
    expect(AppCalculations.getBalanceFlags(-0.004).isSettled).toBe(true)
    expect(AppCalculations.getBalanceFlags(0).isSettled).toBe(true)
  })
})

describe('AppCalculations.sumAmountStrings', () => {
  it('sums parsed float values from amount strings', () => {
    expect(AppCalculations.sumAmountStrings([{ amount: '10.5' }, { amount: '20.25' }])).toBeCloseTo(30.75)
  })

  it('returns 0 for an empty array', () => {
    expect(AppCalculations.sumAmountStrings([])).toBe(0)
  })
})

describe('AppCalculations.buildExpenseDelta', () => {
  it('when iPaid is true: lent = amount - myShare, owe = 0', () => {
    expect(AppCalculations.buildExpenseDelta('100', '30', true)).toEqual({ lent: 70, owe: 0 })
  })

  it('when iPaid is false: lent = 0, owe = myShare', () => {
    expect(AppCalculations.buildExpenseDelta('100', '30', false)).toEqual({ lent: 0, owe: 30 })
  })

  it('defaults myShare to 0 when myShareAmount is undefined', () => {
    expect(AppCalculations.buildExpenseDelta('100', undefined, true)).toEqual({ lent: 100, owe: 0 })
  })
})

describe('AppCalculations.relativeTime', () => {
  const tCommon = (key: string, values?: Record<string, string | number | Date>) => (values ? `${key}:${values['0']}` : key)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "now" for times less than 60 seconds ago', () => {
    expect(AppCalculations.relativeTime('2024-06-15T11:59:30Z', 'en', tCommon)).toBe('now')
  })

  it('returns minutes_short key with count for 1–59 minutes ago', () => {
    expect(AppCalculations.relativeTime('2024-06-15T11:30:00Z', 'en', tCommon)).toBe('minutes_short:30')
  })

  it('returns hours_short key with count for 1–23 hours ago', () => {
    expect(AppCalculations.relativeTime('2024-06-15T10:00:00Z', 'en', tCommon)).toBe('hours_short:2')
  })

  it('returns days_short key with count for 1–6 days ago', () => {
    expect(AppCalculations.relativeTime('2024-06-12T12:00:00Z', 'en', tCommon)).toBe('days_short:3')
  })

  it('returns a short locale date for >= 7 days ago with dateStyle "short"', () => {
    const result = AppCalculations.relativeTime('2024-06-01T00:00:00Z', 'en', tCommon, 'short')
    expect(result).toMatch(/Jun/)
  })

  it('delegates to formatDate for >= 7 days ago with default dateStyle "full"', () => {
    const result = AppCalculations.relativeTime('2024-06-01T00:00:00Z', 'en', tCommon)
    expect(result).toMatch(/Jun/)
  })
})
