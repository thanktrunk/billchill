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
