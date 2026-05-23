# billchill

A mobile-first group expense tracker PWA. Split expenses with friends, track who paid, who owes, and settle up with the minimum number of transfers.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 6, React 19 |
| Styling | Tailwind CSS v4 + CSS custom properties (design tokens) |
| Auth | Auth0 via `@auth0/nextjs-auth0` v4 |
| Database | PostgreSQL via `drizzle-orm` + `postgres` |
| Migrations | Drizzle Kit (`drizzle-kit migrate`) |
| Testing | Playwright (E2E, `tests/e2e/`) |
| Fonts | Newsreader (serif headings), Be Vietnam Pro (body), JetBrains Mono (numbers) |

---

## Getting started

### 1. Environment variables

Create `.env.local`:

```
# Auth0
AUTH0_SECRET=<random 32-byte hex>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<your-tenant>.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
APP_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/billchill
```

### 2. Install & migrate

```bash
npm install
npm run db:migrate   # run Drizzle migrations against DATABASE_URL
```

### 3. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The middleware auto-redirects `/` → `/{locale}` based on `Accept-Language`.

---

## Scripts

```bash
npm run dev              # next dev (Turbopack)
npm run build            # next build
npm run start            # next start

npm run db:generate      # generate a new migration from schema changes
npm run db:migrate       # apply migrations (local DATABASE_URL)
npm run db:migrate:prod  # apply migrations (PROD_DATABASE_URL)
npm run db:push          # push schema without migrations (dev only)
npm run db:studio        # open Drizzle Studio

npm run test:e2e         # playwright test
npm run test:e2e:ui      # playwright --ui
npm run test:e2e:report  # show last report
```

---

## Project structure

```
src/
├── app/
│   ├── [lang]/                   # locale prefix (en | vi)
│   │   ├── dictionaries.ts       # getDictionary(lang) loader
│   │   ├── layout.tsx            # root layout: fonts + CSS vars
│   │   └── (app)/                # authenticated route group
│   │       ├── layout.tsx        # auth gate → LandingPage or app shell + BottomNav
│   │       ├── page.tsx          # redirect → /[lang]/groups
│   │       ├── groups/
│   │       │   ├── page.tsx      # groups home: balance hero + group list
│   │       │   ├── new/          # create group form
│   │       │   └── [id]/
│   │       │       ├── page.tsx              # server: fetch group data
│   │       │       ├── group-detail-client.tsx  # client: tabs, expense list, balances
│   │       │       ├── expenses/new/         # add expense (numpad → details)
│   │       │       └── settle/              # settle up form
│   │       ├── notifications/    # activity feed
│   │       └── profile/          # user profile + preferences
│   ├── globals.css               # BC paper-theme design tokens
│   └── manifest.ts               # PWA manifest
├── components/
│   ├── bc-ui.tsx                 # shared design system (BCIcon, BCCard, BCButton, BCNumPad…)
│   ├── bottom-nav.tsx            # floating pill nav (Groups / Activity / Profile)
│   └── …
├── db/
│   ├── index.ts                  # drizzle client
│   └── schema/                   # groups, groupMembers, expenses, expenseSplits,
│                                 #   settlements, notifications, users
├── dictionaries/
│   ├── en.json                   # English strings (~150 keys)
│   └── vi.json                   # Vietnamese strings
├── i18n/
│   ├── request.ts                # next-intl request config
│   └── routing.ts                # next-intl routing config
├── lib/
│   ├── auth.ts                   # getCurrentUser / requireUser (Auth0 → DB upsert)
│   ├── auth0.ts                  # Auth0Client singleton
│   ├── access-control.ts         # verifyGroupMembership
│   ├── balance.ts                # calculateBalances + minimizeDebts
│   ├── i18n.ts                   # locales, hasLocale, defaultLocale
│   ├── locale-context.tsx        # LocaleProvider + useLocale hook
│   └── utils.ts                  # cn() and misc helpers
├── messages/
│   ├── en.json                   # next-intl English messages
│   └── vi.json                   # next-intl Vietnamese messages
├── proxy.ts                      # Edge middleware: locale redirect + Auth0 + auth guard
└── types/
    └── next-helpers.d.ts         # PageProps / LayoutProps generics
```

---

## Database schema

```
users            id, auth0_id, email, display_name, avatar_url, created_at
groups           id, name, currency, created_by→users, created_at, archived_at
group_members    id, group_id→groups, user_id→users, display_name, default_share, is_active, created_at
expenses         id, group_id→groups, paid_by→group_members, amount, currency,
                   description, category, date, created_by→users, created_at
expense_splits   id, expense_id→expenses, member_id→group_members, share_amount
settlements      id, group_id→groups, from_member→group_members,
                   to_member→group_members, amount, settled_at, created_by→users
notifications    id, user_id→users, group_id→groups, type(enum), message, is_read, created_at
```

All IDs are UUIDs. `currency` is a 3-char ISO code (USD, EUR, GBP, JPY…).  
`expense_splits.share_amount` and `expenses.amount` are `numeric(12,2)` stored as strings in JS.

---

## Request flow

```
Request
  └─ src/proxy.ts (middleware)
       ├─ /auth/* → Auth0 handler (login / callback / logout)
       ├─ no locale prefix → detect from Accept-Language → redirect to /{locale}/...
       └─ /{locale}/* → verify Auth0 session → allow or redirect to /auth/login
```

## Auth flow

1. Unauthenticated visit to `/{lang}` → middleware lets through → `(app)/layout.tsx` renders `LandingPage`.
2. "Continue" CTA → `/auth/login?returnTo=/{lang}/groups` → Auth0 universal login.
3. After login, Auth0 redirects to `returnTo`. `getCurrentUser()` upserts the user row on every request.
4. Visiting any sub-route (groups, profile…) without a session → middleware redirects to `/auth/login?returnTo=…`.
5. Logout → `/auth/logout?returnTo=/{lang}` → clears session, returns to landing page.

---

## i18n

Locales: `en` (default) and `vi`. The `[lang]` route segment carries the locale for every page. The `Accept-Language` header is used to pick a locale on first visit (via `negotiator`).

Dictionary keys follow the pattern `section.key`, e.g. `group.settle_up`, `landing.tagline`, `notif.expense_added`. Both dictionaries live in `src/dictionaries/` and are imported server-side only.

`LocaleProvider` + `useLocale()` expose `{ lang, dict }` to client components (used by `BottomNav`).

---

## Design system

**Theme tokens** (`globals.css`):

| Token | Light | Dark |
|---|---|---|
| `--bc-bg` | `#F0EADE` (cream paper) | `#15130F` |
| `--bc-surface` | `#FBF7EE` | `#1F1C16` |
| `--bc-ink` | `#1A1A1A` | `#F5F1EA` |
| `--bc-muted` | `#6B6359` | `#9E9488` |
| `--bc-accent` | `#E5572F` (orange-red) | `#E5572F` |
| `--bc-pos` | `#3F6E55` (green) | `#5A9E78` |
| `--bc-neg` | `#E5572F` | `#F2A788` |

**`bc-ui.tsx` exports**: `BCIcon`, `BCAvatar`, `BCAvatarStack`, `BCGroupGlyph`, `BCCategoryBadge`, `BCCard`, `BCSectionLabel`, `BCTopBar`, `BCIconBtn`, `BCButton`, `BCNumPad`, `BCAmountDisplay`, `BCTabs`, `BCChip`, `BCSpinner`, `BCBalanceBadge`.

**Bottom nav**: fixed floating pill (`var(--bc-ink)` background), active tab shows label + icon on `var(--bc-bg)` pill, inactive tabs icon-only.

---

## Balance calculation

`src/lib/balance.ts`:

- `calculateBalances(members, expenses, settlements)` — computes each member's net balance. Positive = owed money; negative = owes money.
- `minimizeDebts(balances)` — greedy algorithm that produces the minimum number of `DebtTransaction` objects to clear all debts.

---

## CI / CD

`.github/workflows/db-migration.yml` runs `drizzle-kit migrate` against `PROD_DATABASE_URL` on every push to `main` that touches `drizzle/**`.

---

## E2E tests

Playwright tests live in `tests/e2e/`. Credentials are set via `E2E_EMAIL` and `E2E_PASSWORD` in `.env.local`; the auth session is cached at `tests/e2e/.auth/session.json`.

```bash
npm run test:e2e         # run all tests (headless)
npm run test:e2e:ui      # open Playwright UI
npm run test:e2e:report  # show last HTML report
```

Every user-facing feature must have a corresponding test. The `auth.setup.ts` project logs in once and saves the session for all other tests.
