# Unit Tests for `src/lib` Pure Functions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest unit test suite covering all pure functions in `src/lib/balance.ts`, `currency.ts`, `utils.ts`, and `app-calculations.ts`.

**Architecture:** Install Vitest with `vite-tsconfig-paths` to resolve the `@/` alias, add a minimal `vitest.config.ts`, and co-locate test files with their source modules. No mocking is needed — all target functions are pure or depend only on the built-in `Intl` API.

**Tech Stack:** Vitest 3.x, vite-tsconfig-paths, TypeScript, Node environment.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `vitest.config.ts` | Vitest configuration — node env, `@/` alias, include pattern |
| Modify | `package.json` | Add `test:unit` and `test:unit:watch` scripts |
| Create | `src/lib/balance.test.ts` | Tests for `calculateBalances` and `minimizeDebts` |
| Create | `src/lib/currency.test.ts` | Tests for `currencySymbol`, `formatCurrency`, `formatCurrencyShort`, `formatDate`, `suggestedAmounts` |
| Create | `src/lib/utils.test.ts` | Tests for `cn` and `toViRegex` |
| Create | `src/lib/app-calculations.test.ts` | Tests for all `AppCalculations` static methods |

---

## Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
npm install --save-dev vitest vite-tsconfig-paths
```

Expected: `vitest` and `vite-tsconfig-paths` appear in `package.json` devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Add scripts to `package.json`**

In the `"scripts"` object, add:

```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

- [ ] **Step 4: Verify setup works**

```bash
npm run test:unit
```

Expected: Vitest starts and reports "No test files found" (or exits cleanly — no errors about missing config or unresolved modules).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest for unit testing"
```

---

## Task 2: Tests for `balance.ts`

**Files:**
- Create: `src/lib/balance.test.ts`

- [ ] **Step 1: Create `src/lib/balance.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { calculateBalances, minimizeDebts } from './balance'

describe('calculateBalances', () => {
  it('returns empty array for empty members', () => {
    expect(calculateBalances([], [], [])).toEqual([])
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
    const result = calculateBalances(members, expenses, [])
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
    // Expense 1 (paid by a): a += 5, a -= 5 (own split), a += 5, b -= 5 -> a = +5, b = -5
    // Expense 2 (paid by b): b += 3, a -= 3, b += 3, b -= 3 -> a = +5-3=+2, b = -5+6-3=-2
    const result = calculateBalances(members, expenses, [])
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(2)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(-2)
  })

  it('applies settlements to reduce outstanding balances', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [{ paidBy: 'a', splits: [{ memberId: 'b', shareAmount: '10' }] }]
    const settlements = [{ fromMember: 'b', toMember: 'a', amount: '10' }]
    // After expense: a = +10, b = -10
    // Settlement (b paid a): fromMember b += 10, toMember a -= 10 -> a = 0, b = 0
    const result = calculateBalances(members, expenses, settlements)
    expect(result.find((r) => r.memberId === 'a')?.balance).toBe(0)
    expect(result.find((r) => r.memberId === 'b')?.balance).toBe(0)
  })

  it('rounds floating-point amounts to 2 decimal places', () => {
    const members = [
      { id: 'a', displayName: 'Alice' },
      { id: 'b', displayName: 'Bob' },
    ]
    const expenses = [{ paidBy: 'a', splits: [{ memberId: 'b', shareAmount: '3.337' }] }]
    const result = calculateBalances(members, expenses, [])
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
    const result = calculateBalances(members, expenses, [])
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
      { memberId: 'a', displayName: 'Alice', balance: 3.335 },
      { memberId: 'b', displayName: 'Bob', balance: -3.335 },
    ]
    const result = minimizeDebts(balances)
    expect(result[0].amount).toBe(3.34)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm run test:unit -- src/lib/balance.test.ts
```

Expected: All 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/balance.test.ts
git commit -m "test: add unit tests for balance.ts"
```

---

## Task 3: Tests for `currency.ts`

**Files:**
- Create: `src/lib/currency.test.ts`

- [ ] **Step 1: Create `src/lib/currency.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
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
    expect(formatCurrency(1000, 'JPY')).toBe('¥1,000')
  })

  it('formats VND with no decimal places and trailing symbol', () => {
    const result = formatCurrency(50000, 'VND')
    expect(result).toContain('₫')
    expect(result).not.toMatch(/\.\d\d/)
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
    expect(formatCurrencyShort(2_000_000, 'USD')).toBe('$2M')
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
```

- [ ] **Step 2: Run tests**

```bash
npm run test:unit -- src/lib/currency.test.ts
```

Expected: All 19 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/currency.test.ts
git commit -m "test: add unit tests for currency.ts"
```

---

## Task 4: Tests for `utils.ts`

**Files:**
- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: Create `src/lib/utils.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { cn, toViRegex } from './utils'

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts, keeping the last class', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('excludes falsy conditional classes', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz')
  })

  it('returns empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })
})

describe('toViRegex', () => {
  it('passes non-vowel ASCII characters through unchanged', () => {
    expect(toViRegex('bc')).toBe('bc')
  })

  it('expands a plain ASCII vowel to its Vietnamese character class', () => {
    expect(toViRegex('a')).toBe('[aăâàáảãạắặằẳẵấầẩẫậäåæ]')
  })

  it('expands e to its Vietnamese character class', () => {
    expect(toViRegex('e')).toBe('[eêèéẻẽẹếềểễệë]')
  })

  it('expands i to its Vietnamese character class', () => {
    expect(toViRegex('i')).toBe('[iìíỉĩịï]')
  })

  it('expands o to its Vietnamese character class', () => {
    expect(toViRegex('o')).toBe('[oôơòóỏõọốồổỗộớờởỡợö]')
  })

  it('expands u to its Vietnamese character class', () => {
    expect(toViRegex('u')).toBe('[uưùúủũụứừửữựü]')
  })

  it('expands d to its Vietnamese character class', () => {
    expect(toViRegex('d')).toBe('[dđ]')
  })

  it('normalizes ư (and Ư) to u before expansion', () => {
    expect(toViRegex('ư')).toBe('[uưùúủũụứừửữựü]')
    expect(toViRegex('Ư')).toBe('[uưùúủũụứừửữựü]')
  })

  it('normalizes ơ to o before expansion', () => {
    expect(toViRegex('ơ')).toBe('[oôơòóỏõọốồổỗộớờởỡợö]')
  })

  it('normalizes đ to d before expansion', () => {
    expect(toViRegex('đ')).toBe('[dđ]')
  })

  it('escapes regex special characters', () => {
    expect(toViRegex('.')).toBe('\\.')
    expect(toViRegex('*')).toBe('\\*')
    expect(toViRegex('(')).toBe('\\(')
  })

  it('handles mixed ASCII vowels, consonants, and Vietnamese in one query', () => {
    expect(toViRegex('phu')).toBe('ph[uưùúủũụứừửữựü]')
  })

  it('normalizes uppercase ASCII to lowercase before expanding', () => {
    expect(toViRegex('A')).toBe('[aăâàáảãạắặằẳẵấầẩẫậäåæ]')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm run test:unit -- src/lib/utils.test.ts
```

Expected: All 14 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.test.ts
git commit -m "test: add unit tests for utils.ts"
```

---

## Task 5: Tests for `app-calculations.ts`

**Files:**
- Create: `src/lib/app-calculations.test.ts`

- [ ] **Step 1: Create `src/lib/app-calculations.test.ts`**

```ts
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
    const result = AppCalculations.calculateGroupBalances(members, expenses, splits, [])
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
  const tCommon = (key: string, values?: Record<string, string | number | Date>) =>
    values ? `${key}:${values['0']}` : key

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
```

- [ ] **Step 2: Run tests**

```bash
npm run test:unit -- src/lib/app-calculations.test.ts
```

Expected: All 26 tests pass.

- [ ] **Step 3: Run full suite to confirm no regressions**

```bash
npm run test:unit
```

Expected: All tests across all 4 files pass.

- [ ] **Step 4: Run lint and build**

```bash
npm run lint && npm run build
```

Expected: No new lint errors; build passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-calculations.test.ts
git commit -m "test: add unit tests for app-calculations.ts"
```
