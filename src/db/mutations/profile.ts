import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function setUserDisplayName(userId: string, displayName: string) {
  await db.update(users).set({ displayName }).where(eq(users.id, userId))
}

export async function setUserPreferredCurrency(userId: string, preferredCurrency: string) {
  await db.update(users).set({ preferredCurrency }).where(eq(users.id, userId))
}
