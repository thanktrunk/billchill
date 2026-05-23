import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/schema'

export async function getUnreadNotificationsCount(userId: string) {
  return db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .then((rows) => rows.length)
}
