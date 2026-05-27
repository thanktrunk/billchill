# BillChill — Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| UI | Tailwind CSS v4 + shadcn/ui + Recharts |
| Auth | Auth0 Cloud (`@auth0/nextjs-auth0` SDK v4) |
| Database | Supabase Postgres (via Drizzle ORM) |
| ORM | Drizzle ORM (`drizzle-orm` + `drizzle-kit` + `postgres` driver) |
| Deployment | Vercel |

---

## Database Schema

All tables use UUID primary keys. Amounts stored as `numeric(12,2)`. No RLS — access control enforced in the application layer.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| auth0_id | text unique | |
| email | text | |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamp | |

### `groups`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| currency | text | default `'USD'` |
| created_by | uuid FK → users | |
| created_at | timestamp | |
| archived_at | timestamp nullable | |

### `group_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| user_id | uuid FK → users nullable | null for placeholder members |
| display_name | text | |
| default_share | int | default `1` |
| is_active | bool | default `true` |
| created_at | timestamp | |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| paid_by | uuid FK → group_members | |
| amount | numeric(12,2) | |
| currency | text | |
| description | text | |
| category | text | |
| date | date | |
| created_by | uuid FK → users | |
| created_at | timestamp | |

### `expense_splits`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| expense_id | uuid FK → expenses | |
| member_id | uuid FK → group_members | |
| share_amount | numeric(12,2) | |

### `settlements`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| from_member | uuid FK → group_members | |
| to_member | uuid FK → group_members | |
| amount | numeric(12,2) | |
| settled_at | timestamp | |
| created_by | uuid FK → users | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| group_id | uuid FK → groups | |
| type | enum | |
| message | text | English fallback for pre-i18n rows |
| message_params | jsonb nullable | Structured params for `t(key, params)` render |
| is_read | bool | default `false` |
| created_at | timestamp | |

### Indexes
- `group_id` on `expenses`
- `expense_id` on `expense_splits`
- `user_id` on `group_members`
- `auth0_id` on `users`

---

## Auth Flow

- Auth0 Cloud owns all authentication (login, sessions, JWTs). No Supabase Auth.
- Auth0 SDK v4 uses `Auth0Client` class; middleware handles auth routes (`/auth/login`, `/auth/callback`, `/auth/logout`) automatically.
- On first login, the server upserts a row in the `users` table keyed on `auth0_id`.
- All app routes are protected by middleware verifying the Auth0 session.

---

## Access Control

- No RLS at the database layer.
- Every server action calls `verifyGroupMembership(groupId, userId)` before reading or writing group data.
- Client-supplied user IDs are never trusted — always derive the user from the server-side Auth0 session via `requireUser()`.

---

## Balance & Debt Algorithm

**Balance calculation** (pure function `calculateBalances()`):
- Per member: `net = total_paid − total_owed_via_splits`
- Positive net → owed money back; negative net → owes money.

**Debt minimization** (pure function `minimizeDebts()`):
- Greedy: sort members by balance, repeatedly match the largest creditor with the largest debtor, reduce both, repeat.
- O(n log n). Neither function queries the DB.

---

## Deployment

| Task | Connection | Port |
|---|---|---|
| `drizzle-kit generate/migrate/push` | Direct | 5432 |
| App runtime (Vercel) | Pooler (Supavisor) | 6543 |

- Use `prepare: false` in the postgres client for connection pooler compatibility.
- Run `drizzle-kit migrate` with the direct connection before/during deploy.
- Set `DATABASE_URL` on Vercel to the pooler connection string for runtime.

---

## Group Stats Charts

The Stats tab (`_components/stats-tab.tsx`) renders seven Recharts charts from props already loaded for the group detail page. No extra DB queries are made.

- All chart data is computed with `useMemo` from `expenses`, `splits`, `settlements`, and `balances` props.
- Amounts are summed as raw floats (matching the group's base currency — multi-currency conversion is out of scope).
- Recharts `Cell` components provide per-bar/per-slice colors sourced from `BC_CATEGORIES`.
- A custom `BarAmountLabel` SVG component renders formatted amounts to the right of each bar.
- The spending-over-time area chart is only rendered when 2+ distinct months of data exist.
- Settlement progress is calculated as `settled / (settled + outstanding)` where `settled = Σ settlements.amount` and `outstanding = Σ max(balance, 0)`.

---

## Key Decisions

- **No RLS** — access control entirely in the app layer via server actions.
- **Non-app members** — `group_members` rows with null `user_id` allow adding people who haven't signed up.
- **Server Actions for all mutations** — Edge Functions not needed unless background processing is required.
- **Supabase Storage** — reserved for avatars/receipts, not in MVP.
- **Excluded from scope**: multi-currency conversion, recurring expenses, payment integrations, receipt uploads, real-time updates, group archiving.

---

## Further Considerations

- **Invite flow**: When a placeholder member signs up, use an invite link with a token to associate the existing `group_member` row with the new `user_id`.
- **Connection pooling**: Vercel serverless functions require Supabase Supavisor (port 6543, Transaction mode).
