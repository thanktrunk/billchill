'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/db/mutations/notifications'

export async function markAsRead(lang: string, notificationId: string) {
  const user = await requireUser()

  await markNotificationAsRead(notificationId, user.id)

  revalidatePath(`/${lang}/notifications`)
}

export async function markAsReadAndNavigate(lang: string, notificationId: string, groupId: string) {
  const user = await requireUser()

  await markNotificationAsRead(notificationId, user.id)

  redirect(`/${lang}/groups/${groupId}`)
}

export async function markAllAsRead(lang: string) {
  const user = await requireUser()

  await markAllNotificationsAsRead(user.id)

  revalidatePath(`/${lang}/notifications`)
}
