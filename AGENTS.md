<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BillChill — Agent Guide

> For project overview, stack, setup, scripts, and design system, see [README.md](README.md).

## After every change

1. Run `npm run build` — must pass before considering work done.
2. Review `tests/e2e/` and create or update Playwright E2E tests to cover changed or added behaviour. Every user-facing feature must have a corresponding test.

---

## Key files

| File | Purpose |
|---|---|
| `src/proxy.ts` | Edge middleware — locale redirect + Auth0 guard |
| `src/lib/auth.ts` | `getCurrentUser()` / `requireUser()` — Auth0 → DB upsert |
| `src/lib/access-control.ts` | `verifyGroupMembership(groupId, userId)` |
| `src/lib/balance.ts` | `calculateBalances()` + `minimizeDebts()` (pure functions) |
| `src/lib/locale-context.tsx` | `LocaleProvider` + `useLocale()` (client-side) |
| `src/db/schema/` | Drizzle schema — users, groups, expenses, settlements, notifications |
| `src/components/bc-ui.tsx` | Shared design system primitives |

---

## Coding conventions

- **Server actions** — co-locate in `actions.ts` next to the page that uses them.
- **Auth** — use `requireUser()` (throws if unauthenticated); never trust client-supplied user IDs. `getCurrentUser()` returns null for unauthenticated requests.
- **Group access** — always call `verifyGroupMembership(groupId, userId)` before reading group data.
- **Balances** — `calculateBalances()` + `minimizeDebts()` are pure; do not call the DB inside them.
- **Split methods** — `equal` | `amount` | `shares` | `percentage` — computed in the `addExpense` server action.
- **Locale** — `lang` comes from the `[lang]` route segment; pass it through server layouts; client components use `useLocale()`.
- **DB amounts** — stored as `numeric(12,2)` strings; always `parseFloat()` before arithmetic.
- **i18n** — dictionary keys follow `section.key` (e.g. `group.settle_up`); server-side imports from `src/dictionaries/`; client components use `useLocale()`. Migration to `next-intl` is in progress — see `docs/MIGRATE-NEXT-INTL.md`.

---

## Code quality rules

These rules were distilled from a full codebase review. Follow them for all new and modified code.

### Utilities — reuse before you write

- **Currency symbols** — use `currencySymbol(code)` from `@/lib/utils`. Do not inline the lookup table.
- **UI primitives** — use components from `@/components/bc-ui.tsx` (`BCTopBar`, `BCButton`, `BCCard`, `BCNumPad`, etc.) before writing raw JSX equivalents. Check the file before building any layout primitive.
- **Shared logic** — before writing a helper, grep `src/lib/` and `src/components/` for existing utilities (`cn()`, `currencySymbol()`, etc.).

### Data fetching — server components

- **Fetch data server-side and pass as props.** Do not re-fetch server-available data from the client via `useEffect`. If the page already queries the DB, pass the result as a prop to the client component.
- **Parallelize independent DB calls** with `Promise.all`. Sequential `await` chains for unrelated queries waste latency.
- **Static imports only.** Never `await import(...)` a module that is also used statically — move it to the top-level import. Dynamic imports in server render paths add per-request overhead.
- **No dead queries.** Every `await db...` result must be consumed. If a result is unused, delete the query.

### State and derived values

- **Don't store what you can derive.** If a value can be computed from existing state or props (e.g. `selected = splitWith ?? members.map(m => m.id)`), derive it at render time rather than duplicating it in state.
- **Single-use variable aliases add noise.** Inline single-use expressions (`members.length`) instead of assigning them to a named variable.

### Server actions — keep the interface typed

- **Don't pass data through FormData when you control both sides.** Building a FormData only to immediately unpack it in the same call chain is unnecessary indirection. Pass typed arguments directly to server actions when the caller is a client component.

### Performance — render hot paths

- **Pre-index data that is looked up inside a render loop.** A `splits.filter(s => s.expenseId === id)` call inside a list render is O(n×m). Build a `Map<id, Item[]>` once before the return and use `.get()` inside the loop.

### Comments

- **Write no comments by default.** Only add a comment when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround, or an algorithm choice (e.g. `// Greedy: match largest creditor with largest debtor to minimize transaction count.`).
- **Never comment what the code already says.** Labels like `// Top bar`, `// Amount step`, `// Initialize all members`, or section dividers (`// ── Types ──`) add no information — delete them.
- **No JSX block comments that name the thing below them** (`{/* Save button */}`, `{/* NumPad */}`, etc.).

## E2E test credentials

`E2E_EMAIL` and `E2E_PASSWORD` in `.env.local`. Session is cached at `tests/e2e/.auth/session.json`.