'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { createSettlement, createSettlementRecordedNotifications, findGroupMemberByIdInGroup } from '@/db/mutations/settlements'

export async function recordSettlement(groupId: string, fromMember: string, toMember: string, amount: number) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  if (amount <= 0) throw new Error('Amount must be positive')

  await createSettlement({
    groupId,
    fromMember,
    toMember,
    amount: amount.toFixed(2),
    createdBy: user.id,
  })

  // Notify involved members (other than the actor)
  const [fromRow, toRow] = await Promise.all([
    findGroupMemberByIdInGroup(fromMember, groupId),
    findGroupMemberByIdInGroup(toMember, groupId),
  ])

  const fromName = fromRow?.displayName ?? 'Someone'
  const toName = toRow?.displayName ?? 'Someone'
  const message = `${fromName} paid ${toName} ${amount.toFixed(2)}`

  const recipientUserIds = [fromRow?.userId, toRow?.userId].filter((uid): uid is string => !!uid && uid !== user.id)

  if (recipientUserIds.length > 0) {
    await createSettlementRecordedNotifications(
      recipientUserIds.map((userId) => ({
        userId,
        groupId,
        type: 'settlement_recorded' as const,
        message,
      })),
    )
  }
}
