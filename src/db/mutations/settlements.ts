import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { groupMembers, notifications, settlements } from '@/db/schema'

export async function createSettlement(data: { groupId: string; fromMember: string; toMember: string; amount: string; createdBy: string }) {
  await db.insert(settlements).values(data)
}

export async function findGroupMemberByIdInGroup(memberId: string, groupId: string) {
  return db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)),
  })
}

export async function createSettlementRecordedNotifications(
  rows: { userId: string; groupId: string; type: 'settlement_recorded'; message: string; messageParams?: Record<string, string> }[],
) {
  if (!rows.length) return
  await db.insert(notifications).values(rows)
}

export async function createSettlementWithNotifications(
  settlementData: { groupId: string; fromMember: string; toMember: string; amount: string; createdBy: string },
  notifRows: { userId: string; groupId: string; type: 'settlement_recorded'; message: string; messageParams?: Record<string, string> }[],
) {
  await db.transaction(async (tx) => {
    await tx.insert(settlements).values(settlementData)
    if (notifRows.length) await tx.insert(notifications).values(notifRows)
  })
}
