'use server'

import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function markAsRead(lang: string, notificationId: string) {
  const user = await requireUser()

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))

  revalidatePath(`/${lang}/notifications`)
}

export async function markAsReadAndNavigate(lang: string, notificationId: string, groupId: string) {
  const user = await requireUser()

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))

  redirect(`/${lang}/groups/${groupId}`)
}

export async function markAllAsRead(lang: string) {
  const user = await requireUser()

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id))

  revalidatePath(`/${lang}/notifications`)
}
