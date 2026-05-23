import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { groups, notifications } from '@/db/schema'

export async function getUserNotificationsWithGroups(userId: string) {
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  const groupIds = [...new Set(userNotifications.map((n) => n.groupId))]
  const groupRows = groupIds.length
    ? await db.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, groupIds))
    : []

  return {
    userNotifications,
    groupMap: new Map(groupRows.map((group) => [group.id, group.name])),
  }
}
