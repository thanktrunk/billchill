import { cache } from 'react'
import { auth0 } from '@/lib/auth0'
import { db } from '@/db'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function getSession() {
  return auth0.getSession()
}

// Deduplicated per request — the upsert fires at most once per page load regardless of how many call sites invoke this.
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
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
