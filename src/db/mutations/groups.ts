import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { groupMembers, groups, notifications } from '@/db/schema'

export async function createGroupWithOwner(owner: { id: string; displayName: string }, data: { name: string; currency: string }) {
  const [group] = await db
    .insert(groups)
    .values({
      name: data.name,
      currency: data.currency,
      createdBy: owner.id,
    })
    .returning()

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: owner.id,
    displayName: owner.displayName,
  })

  await db.insert(notifications).values({
    userId: owner.id,
    groupId: group.id,
    type: 'member_added',
    message: `You created the group "${data.name}"`,
  })

  return group
}

export async function updateGroupSettings(groupId: string, data: { name: string; currency: string }) {
  await db.update(groups).set({ name: data.name, currency: data.currency }).where(eq(groups.id, groupId))
}

export async function archiveGroupById(groupId: string) {
  await db.update(groups).set({ archivedAt: new Date() }).where(eq(groups.id, groupId))
}
