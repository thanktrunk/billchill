import { or, ilike } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function searchAppUsers(query: string) {
  const pattern = `%${query}%`
  return db
    .select({ id: users.id, displayName: users.displayName, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(or(ilike(users.displayName, pattern), ilike(users.email, pattern)))
    .limit(6)
}
