import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { groupMembers, groups, notifications, users } from '@/db/schema'

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) })
}

export async function findGroupMemberByUser(groupId: string, userId: string) {
  return db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
  })
}

export async function findGroupName(groupId: string) {
  return db
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .then((rows) => rows[0])
}

export async function findGroupMemberById(groupId: string, memberId: string) {
  return db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)),
  })
}

export async function findActiveGroupMemberUserIds(groupId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))
  return rows.map((r) => r.userId).filter(Boolean) as string[]
}

export async function reactivateGroupMember(memberId: string) {
  await db.update(groupMembers).set({ isActive: true }).where(eq(groupMembers.id, memberId))
}

export async function createMemberAddedNotifications(rows: { userId: string; groupId: string; type: 'member_added'; message: string }[]) {
  await db.insert(notifications).values(rows)
}

export async function createMemberRenamedNotifications(rows: { userId: string; groupId: string; message: string }[]) {
  if (!rows.length) return
  await db.insert(notifications).values(rows.map((r) => ({ ...r, type: 'member_renamed' as const })))
}

export async function createGroupMember(data: { groupId: string; userId: string | null; displayName: string }) {
  await db.insert(groupMembers).values(data)
}

export async function updateGroupMember(groupId: string, memberId: string, data: { displayName: string; defaultShare: number }) {
  await db
    .update(groupMembers)
    .set(data)
    .where(and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)))
}

export async function setGroupMemberActive(groupId: string, memberId: string, isActive: boolean) {
  await db
    .update(groupMembers)
    .set({ isActive })
    .where(and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)))
}
