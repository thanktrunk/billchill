import { or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { toViRegex } from '@/lib/utils'

export async function searchAppUsers(query: string) {
  const nameRegex = toViRegex(query)
  const emailPattern = `%${query}%`
  return db
    .select({ id: users.id, displayName: users.displayName, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(
      or(
        sql`${users.displayName} ~* ${nameRegex}`,
        sql`${users.email} ilike ${emailPattern}`,
      ),
    )
    .limit(6)
}
