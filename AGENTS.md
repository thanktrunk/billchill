<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BillChill — Agent Guide

> For project overview, stack, setup, scripts, and design system, see [README.md](README.md).

## After every change

1. Run `npm run format` — format all changed files before anything else.
2. Run `npm run lint` — fix all lint errors before proceeding.
3. Run `npm run build` — must pass before considering work done.
4. Run `npm run test:e2e` — review `tests/e2e/` and create or update Playwright E2E tests to cover changed or added behaviour. Every user-facing feature must have a corresponding test.
5. Update `docs/ARCHITECTURE.md` if the change affects the stack, DB schema, auth flow, access control, algorithms, or deployment config.
6. Update `docs/REQUIREMENTS.md` if the change adds, removes, or modifies any functional or non-functional behaviour.

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

### Styling — Tailwind first

- **Tailwind classes are the default.** Never write an inline `style={{}}` for a value that Tailwind can express — including arbitrary values (`text-[11px]`, `rounded-[22px]`) and CSS variable references.
- **CSS variable shorthand.** In Tailwind v4, reference design tokens as `bg-(--bc-ink)`, `text-(--bc-muted)`, `border-(--bc-softhair)` — not `bg-[var(--bc-ink)]`. Use the shorter form everywhere.
- **Scale tokens over arbitrary pixels.** Prefer Tailwind scale tokens (`py-2.5`, `gap-3.5`, `max-w-120`, `tracking-tight`) over arbitrary values (`py-[10px]`, `gap-[14px]`, `max-w-[480px]`) whenever the scale matches.
- **CSS utility classes for repeated patterns.** If the same combination of classes appears in 3+ places, add a named utility to `globals.css` `@layer utilities`. Current utilities: `.bc-page` (full-height page root), `.bc-wordmark` (serif app name heading), `.bc-nav-bottom` (floating nav safe-area offset), `.animate-bc-spin`.
- **Keep inline styles only for genuinely dynamic values** — sizes and colors computed at runtime from props or data (e.g. avatar diameter from a `size` prop, tint color from a hash). These cannot be expressed as static classes.
- **`cn()` for conditional classes.** Use `cn()` from `@/lib/utils` (which wraps `clsx` + `tailwind-merge`) whenever classes are conditional or need conflict resolution. Do not use template literals for class composition.
- **Active/hover states via Tailwind pseudo-classes** (`active:bg-(--bc-chip)`, `hover:opacity-80`) rather than `onMouseDown`/`onTouchStart` DOM style mutations.

### Comments

- **Write no comments by default.** Only add a comment when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround, or an algorithm choice (e.g. `// Greedy: match largest creditor with largest debtor to minimize transaction count.`).
- **Never comment what the code already says.** Labels like `// Top bar`, `// Amount step`, `// Initialize all members`, or section dividers (`// ── Types ──`) add no information — delete them.
- **No JSX block comments that name the thing below them** (`{/* Save button */}`, `{/* NumPad */}`, etc.).

## E2E test credentials

`E2E_EMAIL` and `E2E_PASSWORD` in `.env.local`. Session is cached at `tests/e2e/.auth/session.json`.