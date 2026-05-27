# Auth Enhancement — cache(), session separation

## Context

Currently `getCurrentUser()` in `src/lib/auth.ts` runs a DB upsert on **every call** — every page render, every server action, every API route. With 19 files calling `requireUser()` (27 call sites), this means many redundant write round-trips per page load. The two improvements:

1. **Wrap `getCurrentUser` in React `cache()`** — deduplicate within a single request lifecycle
2. **Separate `getSession()` from `getCurrentUser()`** — pure session check vs. DB-enriched user

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/auth.ts` | Add `getSession()`, wrap `getCurrentUser` in `cache()`, keep upsert |

No call-site changes needed — `requireUser()` interface stays identical.

---

## Implementation

### `src/lib/auth.ts`

```ts
import { cache } from 'react'
import { auth0 } from '@/lib/auth0'
import { db } from '@/db'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'

// Pure session check — no DB, safe to call anywhere
export async function getSession() {
  return auth0.getSession()
}

// DB upsert deduplicated per request via cache() — fires at most once per page load
export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session?.user) return null

  const { sub, email, name, picture } = session.user

  const [dbUser] = await db
    .insert(users)
    .values({
      auth0Id: sub as string,
      email: (email as string) || '',
      displayName: (name as string) || (email as string) || 'User',
      avatarUrl: (picture as string) || null,
    })
    .onConflictDoUpdate({
      target: users.auth0Id,
      set: {
        email: (email as string) || '',
        avatarUrl: sql`COALESCE(${users.avatarUrl}, EXCLUDED.avatar_url)`,
      },
    })
    .returning()

  return dbUser
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
```

**Key changes:**
- `cache()` wraps `getCurrentUser` — 27 call sites across one page load → 1 DB hit
- `getSession()` exported separately for pure session checks without DB
- Upsert logic unchanged — new users are still created on first login

---

## Verification

1. `npm run format` — format changed files
2. `npm run lint` — must pass
3. `npm run build` — must pass
4. `npm run test:e2e` — existing auth and group flows must pass
