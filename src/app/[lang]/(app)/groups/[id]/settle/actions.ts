'use server'

import { db } from '@/db'
import { settlements, groupMembers, notifications } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { eq, and } from 'drizzle-orm'

export async function recordSettlement(groupId: string, fromMember: string, toMember: string, amount: number) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  if (amount <= 0) throw new Error('Amount must be positive')

  await db.insert(settlements).values({
    groupId,
    fromMember,
    toMember,
    amount: amount.toFixed(2),
    createdBy: user.id,
  })

  // Notify involved members (other than the actor)
  const [fromRow, toRow] = await Promise.all([
    db.query.groupMembers.findFirst({ where: and(eq(groupMembers.id, fromMember), eq(groupMembers.groupId, groupId)) }),
    db.query.groupMembers.findFirst({ where: and(eq(groupMembers.id, toMember), eq(groupMembers.groupId, groupId)) }),
  ])

  const fromName = fromRow?.displayName ?? 'Someone'
  const toName = toRow?.displayName ?? 'Someone'
  const message = `${fromName} paid ${toName} ${amount.toFixed(2)}`

  const recipientUserIds = [fromRow?.userId, toRow?.userId].filter((uid): uid is string => !!uid && uid !== user.id)

  if (recipientUserIds.length > 0) {
    await db.insert(notifications).values(
      recipientUserIds.map((userId) => ({
        userId,
        groupId,
        type: 'settlement_recorded' as const,
        message,
      })),
    )
  }
}
