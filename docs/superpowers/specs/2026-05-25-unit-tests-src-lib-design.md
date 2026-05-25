# Unit Tests for `src/lib` Pure Functions

**Date:** 2026-05-25
**Status:** Approved

## Overview

Add a Vitest unit test suite covering all pure functions in `src/lib`. No existing unit test runner is configured; only Playwright E2E tests exist. This spec covers setup and test coverage for the four files with no DB or auth dependencies.

## Scope

**In scope (pure functions, no mocking):**
- `src/lib/balance.ts`
- `src/lib/currency.ts`
- `src/lib/utils.ts`
- `src/lib/app-calculations.ts`

**Out of scope:**
- `access-control.ts`, `auth.ts`, `auth0.ts`, `i18n.ts` — require DB/Auth0 mocking, deferred to a future spec.

## Setup

**Dependencies:**
- Add `vitest` and `vite-tsconfig-paths` as dev dependencies.

**Config file:** `vitest.config.ts` at project root:
- Use `vite-tsconfig-paths` plugin to resolve the `@/` path alias.
- Set `environment: 'node'` (pure functions, no DOM needed).
- Include pattern: `src/**/*.test.ts`.

**`package.json` scripts:**
- `"test:unit": "vitest run"` — single run for CI.
- `"test:unit:watch": "vitest"` — watch mode for development.

## Test Files

Test files live co-located with source (`src/lib/*.test.ts`).

### `balance.test.ts`

Tests for `calculateBalances` and `minimizeDebts`.

`calculateBalances`:
- Empty members/expenses/settlements returns empty array.
- Single expense, equal split among two members — payer has positive balance, other has negative.
- Multiple expenses with mixed payers.
- Settlements reduce outstanding balances correctly.
- Floating-point amounts round to 2 decimal places.
- Member with no splits in any expense has zero balance.

`minimizeDebts`:
- All-zero balances returns empty transactions.
- Simple two-person debt produces one transaction.
- Three-person scenario produces fewer transactions than naive pairwise (greedy minimization).
- Amounts below epsilon (0.01) are not included as transactions.
- Returned amounts are rounded to 2 decimal places.

### `currency.test.ts`

Tests for `currencySymbol`, `formatCurrency`, `formatCurrencyShort`, `formatDate`, `suggestedAmounts`.

`currencySymbol`:
- Returns correct symbol for all 8 supported codes (USD → `$`, VND → `₫`, etc.).
- Returns the raw code for unknown input.

`formatCurrency`:
- USD: formats with `$` prefix and 2 decimal places.
- JPY/VND: zero decimal places.
- Unknown 3-letter code: falls through to plain number + code suffix.
- Non-ISO label (e.g. `"CUSTOM"`): plain number + label suffix.
- String input is parsed correctly.
- `NaN` / non-finite input renders as `0`.

`formatCurrencyShort`:
- Values < 1,000: delegates to `formatCurrency`.
- Values ≥ 1,000: appends `K` suffix.
- Values ≥ 1,000,000: appends `M` suffix.
- Negative values: sign precedes symbol.
- VND (trailing symbol): symbol appears after number+suffix.

`formatDate`:
- `lang: 'en'` produces English locale date string.
- `lang: 'vi'` produces Vietnamese locale date string.
- Custom `options` override is respected.

`suggestedAmounts`:
- Returns correct array for each supported currency.
- Returns fallback `[10, 20, 50, 100]` for unknown code.

### `utils.test.ts`

Tests for `cn` and `toViRegex`.

`cn`:
- Merges multiple class strings.
- Resolves Tailwind conflicts (e.g. `bg-red-500` overridden by `bg-blue-500`).
- Conditional classes: falsy values are excluded.
- Empty/no arguments returns empty string.

`toViRegex`:
- Plain ASCII passthrough (no diacritics) returns same string wrapped in char classes where applicable.
- Vietnamese diacritics on `a`, `e`, `i`, `o`, `u`, `y`, `d` expand to the correct character class pattern.
- `ư`/`ơ`/`đ` variants normalise to `u`/`o`/`d` before expansion.
- Regex special characters in input are escaped.
- Case-insensitive: uppercase input normalises to lowercase.

### `app-calculations.test.ts`

Tests for all static methods on `AppCalculations`.

`buildExpenseSplitsByExpenseId`:
- Empty splits returns empty map.
- Splits for the same expense ID are grouped together.
- Multiple distinct expense IDs produce separate map entries.

`buildExpensesWithSplits`:
- Expense with no matching splits gets an empty `splits` array.
- Splits are correctly associated to their expense.

`calculateGroupBalances`:
- Delegates correctly to `calculateBalances` — integration of `buildExpensesWithSplits` + `calculateBalances`.

`getMyBalance`:
- Returns the balance for the matching member.
- Returns `0` when `myMemberId` is `null` or `undefined`.
- Returns `0` when the member is not found.

`summarizeMyBalances`:
- `totalOwed` sums only positive balances.
- `totalOwe` sums only negative balances (as positive value).
- `netBalance` equals `totalOwed - totalOwe`.

`getBalanceFlags`:
- `isOwed: true` when balance > epsilon.
- `isOwing: true` when balance < -epsilon.
- `isSettled: true` when balance is within epsilon of zero.

`sumAmountStrings`:
- Sums parsed float values across items.
- Empty array returns `0`.

`buildExpenseDelta`:
- When `iPaid: true`: `lent = amount - myShare`, `owe = 0`.
- When `iPaid: false`: `lent = 0`, `owe = myShare`.
- Handles missing `myShareAmount` (defaults to `0`).

`relativeTime`:
- < 60s: returns the `'now'` key.
- 1–59 min: returns `'minutes_short'` with correct count.
- 1–23 hr: returns `'hours_short'` with correct count.
- 1–6 days: returns `'days_short'` with correct count.
- ≥ 7 days, `dateStyle: 'short'`: returns formatted short date.
- ≥ 7 days, `dateStyle: 'full'` (default): delegates to `formatDate`.

## Test Conventions

- One `describe` block per exported symbol.
- `it` descriptions state the condition and expected outcome.
- No shared mutable state between tests; inputs are defined inline or in a `beforeEach`.
- `relativeTime` tests use a fixed `Date` via `vi.setSystemTime` / `vi.useFakeTimers`.
