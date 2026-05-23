'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateDisplayName(lang: string, name: string) {
  const user = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  await db.update(users).set({ displayName: trimmed }).where(eq(users.id, user.id))

  revalidatePath(`/${lang}/profile`)
}

export async function updatePreferredCurrency(lang: string, currency: string) {
  const user = await requireUser()
  const code = currency.trim().toUpperCase().slice(0, 3)
  if (!code) throw new Error('Currency is required')

  await db.update(users).set({ preferredCurrency: code }).where(eq(users.id, user.id))

  revalidatePath(`/${lang}/profile`)
}
