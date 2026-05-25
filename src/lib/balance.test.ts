import { describe, expect, it } from 'vitest'
import { calculateBalances, minimizeDebts } from './balance'

describe('calculateBalances', () => {
  it('returns empty array for empty members', () => {
    expect(calculateBalances([], [])).toEqual([])
  })

  it('assigns positive balance to payer and negative to the split member', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [
      {
        paidBy: 'a',
        splits: [
          { memberId: 'a', shareAmount: '5' },
          { memberId: 'b', shareAmount: '5' },
        ],
      },
    ]
    const result = calculateBalances(members, expenses)
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(5)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(-5)
  })

  it('accumulates balances across multiple expenses with mixed payers', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [
      {
        paidBy: 'a',
        splits: [
          { memberId: 'a', shareAmount: '5' },
          { memberId: 'b', shareAmount: '5' },
        ],
      },
      {
        paidBy: 'b',
        splits: [
          { memberId: 'a', shareAmount: '3' },
          { memberId: 'b', shareAmount: '3' },
        ],
      },
    ]
    const result = calculateBalances(members, expenses)
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(2)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(-2)
  })

  it('rounds floating-point amounts to 2 decimal places', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [{ paidBy: 'a', splits: [{ memberId: 'b', shareAmount: '3.337' }] }]
    const result = calculateBalances(members, expenses)
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(3.34)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(-3.34)
  })

  it('gives zero balance to a member with no splits in any expense', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
      { id: 'c', displayName: 'Carol' },
    ]
    const expenses = [{ paidBy: 'a', splits: [{ memberId: 'b', shareAmount: '10' }] }]
    const result = calculateBalances(members, expenses)
    expect(result.find((r) => r.memberId === 'c')?.balance).toBe(0)
  })
})

describe('minimizeDebts', () => {
  it('returns empty array when all balances are zero', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 0 },
      { memberId: 'b', displayName: 'Bob', balance: 0 },
    ]
    expect(minimizeDebts(balances)).toEqual([])
  })

  it('produces one transaction for a simple two-person debt', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 10 },
      { memberId: 'b', displayName: 'Bob', balance: -10 },
    ]
    const result = minimizeDebts(balances)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      from: { memberId: 'b' },
      to: { memberId: 'a' },
      amount: 10,
    })
  })

  it('produces 2 transactions for a three-person scenario (greedy minimization)', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 15 },
      { memberId: 'b', displayName: 'Bob', balance: -10 },
      { memberId: 'c', displayName: 'Carol', balance: -5 },
    ]
    const result = minimizeDebts(balances)
    expect(result).toHaveLength(2)
    const total = result.reduce((sum, t) => sum + t.amount, 0)
    expect(total).toBe(15)
  })

  it('excludes transactions for balances within epsilon (0.01)', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 0.005 },
      { memberId: 'b', displayName: 'Bob', balance: -0.005 },
    ]
    expect(minimizeDebts(balances)).toHaveLength(0)
  })

  it('rounds transaction amounts to 2 decimal places', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 3.337 },
      { memberId: 'b', displayName: 'Bob', balance: -3.337 },
    ]
    const result = minimizeDebts(balances)
    expect(result[0].amount).toBe(3.34)
  })

  it('applies settlements to reduce suggested debts', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 10 },
      { memberId: 'b', displayName: 'Bob', balance: -10 },
    ]
    const settlements = [{ fromMember: 'b', toMember: 'a', amount: '10' }]
    expect(minimizeDebts(balances, settlements)).toHaveLength(0)
  })

  it('shows remaining debt after partial settlement', () => {
    const balances = [
      { memberId: 'a', displayName: 'Alice', balance: 10 },
      { memberId: 'b', displayName: 'Bob', balance: -10 },
    ]
    const settlements = [{ fromMember: 'b', toMember: 'a', amount: '6' }]
    const result = minimizeDebts(balances, settlements)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ from: { memberId: 'b' }, to: { memberId: 'a' }, amount: 4 })
  })
})
