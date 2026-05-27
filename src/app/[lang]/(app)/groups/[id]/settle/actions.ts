'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { findGroupMemberByIdInGroup, createSettlementWithNotifications } from '@/db/mutations/settlements'
import { findGroupById } from '@/db/mutations/expenses'

export async function recordSettlement(groupId: string, fromMember: string, toMember: string, amount: number) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  if (amount <= 0) throw new Error('Amount must be positive')

  const [fromRow, toRow, group] = await Promise.all([
    findGroupMemberByIdInGroup(fromMember, groupId),
    findGroupMemberByIdInGroup(toMember, groupId),
    findGroupById(groupId),
  ])

  const fromName = fromRow?.displayName ?? 'Someone'
  const toName = toRow?.displayName ?? 'Someone'
  const currency = group?.currency ?? ''
  const amountStr = amount.toFixed(2)
  const message = `${fromName} paid ${toName}${currency ? ` ${currency}` : ''} ${amountStr}`

  const recipientUserIds = [fromRow?.userId, toRow?.userId].filter((uid): uid is string => !!uid && uid !== user.id)

  await createSettlementWithNotifications(
    { groupId, fromMember, toMember, amount: amountStr, createdBy: user.id },
    recipientUserIds.map((userId) => ({
      userId,
      groupId,
      type: 'settlement_recorded' as const,
      message,
      messageParams: { key: 'msg_settlement_paid', from: fromName, to: toName, currency, amount: amountStr },
    })),
  )
}
