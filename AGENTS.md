<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# After implementing any change
Run the build to ensure everything is good

Review `tests/e2e/` and create or update E2E test cases to cover the changed or added behaviour. Every user-facing feature must have a corresponding Playwright test.

---

# Project: BillChill

Group expense splitting PWA. Users create groups, add expenses with flexible split methods, and track who owes whom with automatic debt minimization.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Auth0 (`@auth0/nextjs-auth0` v4) |
| PWA | Service worker (`public/sw.js`) + Web App Manifest |
| i18n | Custom dictionary system (`en`, `vi`); migration to `next-intl` planned in `docs/MIGRATE-NEXT-INTL.md` |
| Testing | Playwright (E2E only) |
| Local DB | Docker Compose (`docker-compose.yml`) |

## Directory structure

```
src/
  proxy.ts              ← Next.js middleware entry (locale detection + Auth0 auth)
  app/
    [lang]/             ← Locale dynamic segment (en | vi)
      layout.tsx        ← Root layout: fonts, Auth0Provider, generateMetadata
      dictionaries.ts   ← Lazy-loads JSON dictionaries from src/dictionaries/
      (app)/            ← Route group: authenticated app shell
        layout.tsx      ← App shell: header, BottomNav, LocaleProvider
        page.tsx        ← Redirects / → /[lang]/groups
        groups/
          page.tsx      ← Groups list
          new/          ← Create group (server action: createGroup)
          [id]/
            page.tsx    ← Group detail: members, expenses, balances, debt summary
            expenses/
              new/      ← Add expense (server action: addExpense)
        notifications/
          page.tsx      ← Notifications list (server action: markAsRead)
        profile/        ← User profile
    api/                ← API routes (Auth0 handler lives in proxy.ts/auth routes)
    manifest.ts         ← PWA manifest
    globals.css
  components/
    bottom-nav.tsx      ← Mobile tab bar
    language-switcher.tsx ← EN/VI toggle (client component)
    currency-input.tsx
    bc-ui.tsx           ← App-specific UI primitives
    service-worker-register.tsx
    ui/button.tsx       ← shadcn button
  db/
    index.ts            ← Drizzle client (postgres connection)
    schema/
      users.ts          ← users table
      groups.ts         ← groups + group_members tables
      expenses.ts       ← expenses + expense_splits tables
      settlements.ts    ← settlements table
      notifications.ts  ← notifications table + notificationTypeEnum
      relations.ts      ← Drizzle relation definitions
      index.ts          ← re-exports all schema
  lib/
    auth.ts             ← getCurrentUser() / requireUser() — upserts Auth0 user into DB
    auth0.ts            ← Auth0Client singleton (appBaseUrl from env)
    access-control.ts   ← verifyGroupMembership()
    balance.ts          ← calculateBalances() / minimizeDebts()
    i18n.ts             ← locales, defaultLocale, hasLocale (edge-safe)
    locale-context.tsx  ← LocaleProvider + useLocale() hook (client)
    utils.ts            ← cn() and misc helpers
  dictionaries/
    en.json             ← English translations (~150 keys, 14 namespaces)
    vi.json             ← Vietnamese translations (same structure)
  types/                ← Shared TypeScript types
tests/
  e2e/
    auth.setup.ts       ← Playwright auth setup (logs in via Auth0, saves session.json)
    groups.spec.ts      ← E2E tests for group and navigation flows
docs/
  PLAN.md               ← Original feature plan
  MIGRATE-NEXT-INTL.md  ← Migration plan: custom i18n → next-intl
prototype/              ← UI prototype / design reference
public/
  sw.js                 ← Service worker (cache-first for static, network-first for pages)
  icon-192.svg
  icon-512.svg
```

## Database schema

```
users           id, auth0_id, email, display_name, avatar_url, created_at
groups          id, name, currency, created_by→users, created_at, archived_at
group_members   id, group_id→groups, user_id→users, display_name, default_share, is_active, created_at
expenses        id, group_id→groups, paid_by→group_members, amount, currency, description, category, date, created_by→users, created_at
expense_splits  id, expense_id→expenses, member_id→group_members, share_amount
settlements     id, group_id→groups, from_member→group_members, to_member→group_members, amount, settled_at, created_by→users
notifications   id, user_id→users, group_id→groups, type(enum), message, is_read, created_at
```

## Request flow

```
Request
  └─ src/proxy.ts (middleware)
       ├─ /auth/* → Auth0 handler (login / callback / logout)
       ├─ no locale prefix → detect from Accept-Language → redirect to /{locale}/...
       └─ /{locale}/* → verify Auth0 session → allow or redirect to /auth/login
```

## Key conventions

- **Server actions** live in `actions.ts` co-located with the page that uses them
- **Auth**: `requireUser()` throws if unauthenticated; `getCurrentUser()` returns null
- **Group access**: always call `verifyGroupMembership(groupId, userId)` before reading group data
- **Balances**: `calculateBalances()` + `minimizeDebts()` are pure functions in `src/lib/balance.ts`
- **Split methods**: `equal` | `amount` | `shares` | `percentage` — computed in `addExpense` server action
- **Locale**: `lang` param comes from the `[lang]` segment; pass through layouts down to server components; client components use `useLocale()`
- **DB amounts**: stored as `numeric(12,2)` strings; parse with `parseFloat()` before arithmetic
- **E2E credentials**: `E2E_EMAIL` / `E2E_PASSWORD` in `.env.local`; session cached in `tests/e2e/.auth/session.json`

## Environment variables

```
DATABASE_URL           Postgres connection string
AUTH0_SECRET           Auth0 session encryption secret
AUTH0_DOMAIN           Auth0 tenant domain
AUTH0_CLIENT_ID        Auth0 app client ID
AUTH0_CLIENT_SECRET    Auth0 app client secret
AUTH0_BASE_URL         App base URL (e.g. http://localhost:3000)
APP_BASE_URL           Same as AUTH0_BASE_URL (used by Auth0Client)
E2E_EMAIL              Test user email
E2E_PASSWORD           Test user password
```

## Common commands

```bash
npm run dev              # Start dev server
npm run build            # Production build (run after every change)
npm run test:e2e         # Playwright E2E tests
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations (local)
npm run db:migrate:prod  # Run migrations (production)
npm run db:studio        # Open Drizzle Studio
docker-compose up -d     # Start local Postgres
```