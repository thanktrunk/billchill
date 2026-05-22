# Plan: BillChill — Group Expense Splitting Web App

## TL;DR
Build a web app similar to SettleUp for splitting group expenses. Core features: groups, members, expenses, balance tracking, and debt minimization. Stack: Next.js 14+ (App Router) with shadcn/ui + Tailwind, Supabase Postgres (via Drizzle ORM), Auth0 Cloud for auth, deployed on Vercel.

---

## Phase 1: Project Setup & Auth

1. Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS, shadcn/ui
2. Configure Supabase project (Postgres DB only — get direct connection string)
3. Set up Drizzle ORM — `drizzle-orm` + `drizzle-kit` + `postgres` (node-postgres driver)
4. Set up Auth0 Cloud:
   - Create Auth0 tenant + application (Regular Web App)
   - Configure callback/logout URLs for local + production
   - Install `@auth0/nextjs-auth0` SDK (v4)
5. Implement auth flow in Next.js:
   - Auth0 middleware handles all auth routes (`/auth/login`, `/auth/callback`, `/auth/logout`)
   - Middleware to protect app routes (verify Auth0 session)
   - On first login, upsert user in `users` table
6. Set up environment variables structure (`.env.local` template)

**Verification**: User can sign in via Auth0, session persists, user row created in Postgres.

---

## Phase 2: Database Schema (Drizzle + Supabase Postgres)

Define schema in Drizzle (TypeScript, no RLS — access control in app layer):

- `users` — id (uuid), auth0_id (unique), email, display_name, avatar_url, created_at
- `groups` — id (uuid), name, currency (default 'USD'), created_by (FK users), created_at, archived_at
- `group_members` — id (uuid), group_id (FK), user_id (FK users, nullable for non-app members), display_name, default_share (default 1), is_active (default true), created_at
- `expenses` — id (uuid), group_id (FK), paid_by (FK group_members), amount (numeric), currency, description, category, date, created_by (FK users), created_at
- `expense_splits` — id (uuid), expense_id (FK), member_id (FK group_members), share_amount (numeric)
- `settlements` — id (uuid), group_id (FK), from_member (FK group_members), to_member (FK group_members), amount (numeric), settled_at, created_by (FK users)
- `notifications` — id (uuid), user_id (FK users), group_id (FK), type (enum), message, is_read (default false), created_at

**Access control**: Enforced in server actions / API routes — always verify requesting user is a member of the group before any read/write.

**Indexes**: group_id on expenses, expense_id on splits, user_id on group_members, auth0_id on users

7. Create Drizzle schema files (`src/db/schema/`)
8. Generate and run migrations via `drizzle-kit push` or `drizzle-kit generate` + `drizzle-kit migrate`
9. Seed sample data for development

**Verification**: Run migrations against Supabase Postgres, verify tables in Supabase Studio, test queries via Drizzle.

---

## Phase 3: Core Features — Groups & Members

10. **Groups list page** (`/groups`) — show user's groups, create new group button
11. **Create group** (`/groups/new`) — name, default currency
12. **Group detail page** (`/groups/[id]`) — tabs for expenses, balances, members, settings
13. **Add members** — invite by email (if they have account, link; if not, create placeholder member with display name only)
14. **Member management** — edit display_name, default_share, toggle is_active

**Access control**: All server actions check `group_members` table to verify the requesting user belongs to the group.

**Verification**: Create group, add members (both linked and placeholder), verify data in Supabase.

---

## Phase 4: Expenses

15. **Add expense form** (`/groups/[id]/expenses/new`)
    - Payer selection (who paid)
    - Amount + currency
    - Description, category, date
    - Split method: equal, by amount, by shares/weights, by percentage
16. **Expense list** on group page — sortable by date, filterable by member
17. **Expense detail/edit** — view splits, edit, delete
18. **Split calculation logic** (utility functions):
    - Equal split: amount / active members
    - By shares: proportional to weight
    - By amount: explicit amounts per member
    - By percentage: percentage of total

**Verification**: Add expenses with each split type, verify split amounts sum to total.

---

## Phase 5: Balance Calculation & Debt Minimization

19. **Balance calculation** — for each group, compute net balance per member:
    - For each member: (total paid) - (total owed via splits) = net balance
    - Positive = owed money back, Negative = owes money
20. **Debt minimization algorithm** — minimize number of transactions to settle all debts:
    - Algorithm: greedy — sort by balance, match largest creditor with largest debtor, reduce both, repeat
21. **Balances UI** — show who owes whom, with minimized transactions

**Verification**: Create group with multiple expenses, verify balances sum to zero, verify minimized transactions are correct.

---

## Phase 6: Settlements

22. **Mark as settled** — record a settlement (from_member pays to_member amount)
23. **Settlement history** — list of past settlements in group
24. **Balances update** — settlements factor into balance calculation

**Verification**: Settle a debt, verify balances update correctly.

---

## Phase 7: In-App Notifications

25. **Notification creation** — trigger on: expense added, settlement recorded, member added to group (via server action side-effects)
26. **Notification bell** — header icon with unread count
27. **Notification list** (`/notifications`) — mark as read, link to relevant group/expense

**Verification**: Add expense → other group members see notification.

---

## Phase 8: Polish & Deploy

28. **Responsive design** — mobile-first, works well on phone browsers
29. **Loading states & error handling** — skeletons, toast notifications (sonner)
30. **Vercel deployment** — connect repo, configure env vars (Auth0, Supabase connection string)
31. **Supabase production** — use connection pooler (Transaction mode) for serverless compatibility

**Verification**: Deploy to Vercel, full flow works end-to-end.

---

## Drizzle + Supabase Deployment

| Task | Connection | Port |
|------|-----------|------|
| `drizzle-kit generate/migrate/push` | Direct | 5432 |
| App runtime (Vercel) | Pooler (Supavisor) | 6543 |

- Use `prepare: false` in postgres client for connection pooler compatibility
- Run `drizzle-kit migrate` with direct connection before/during deploy
- Set `DATABASE_URL` on Vercel to pooler connection string for runtime

---

## Decisions

- **Auth0 Cloud** handles all authentication — login, sessions, JWTs. No Supabase Auth.
- **Auth0 SDK v4** — uses `Auth0Client` class, middleware handles auth routes automatically.
- **Drizzle ORM** for type-safe DB access via direct Postgres connection (Supabase connection pooler in production).
- **No RLS** — access control enforced in application layer (server actions verify group membership before every query).
- **Debt minimization**: Greedy algorithm (sort by balance, match extremes) — O(n log n), correct for most cases.
- **Non-app members**: `group_members` with null `user_id` — allows adding people who haven't signed up yet.
- **Supabase Storage**: Reserved for later (avatars, receipts). Not in MVP.
- **Scope excluded**: Multi-currency conversion, recurring expenses, payment integrations, receipt uploads, group archiving, real-time updates.

---

## Further Considerations

1. **Invite flow**: When a placeholder member signs up later — recommend invite link with token that associates existing `group_member` row with new `user_id`.
2. **Connection pooling**: Vercel serverless functions require connection pooler. Use Supabase's built-in Supavisor (port 6543, Transaction mode).
3. **Edge Functions vs Server Actions**: Prefer Next.js Server Actions for all mutations. Edge Functions not needed unless background processing is required.
