import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/schema'

export async function markNotificationAsRead(notificationId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
}

export async function markAllNotificationsAsRead(userId: string) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId))
}
