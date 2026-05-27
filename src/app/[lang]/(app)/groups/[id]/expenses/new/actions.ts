'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import {
  createExpense,
  createExpenseAddedNotifications,
  createExpenseSplits,
  findActiveGroupMembers,
  findGroupById,
} from '@/db/mutations/expenses'

export async function getGroupMembers(groupId: string) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const members = (await findActiveGroupMembers(groupId)).map((member) => ({
    id: member.id,
    displayName: member.displayName,
    defaultShare: member.defaultShare,
  }))

  return members
}

export async function addExpense(
  groupId: string,
  formData: FormData,
  splitMethod: 'equal' | 'amount' | 'shares' | 'percentage',
  isTransfer = false,
) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paidBy = formData.get('paidBy') as string
  const date = formData.get('date') as string
  const category = (formData.get('category') as string) || null

  if (!description?.trim() || !amount || !paidBy || !date) {
    throw new Error('All fields are required')
  }

  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }

  const [group, members] = await Promise.all([findGroupById(groupId), findActiveGroupMembers(groupId)])

  // Calculate splits
  const splits = calculateSplits(members, amount, splitMethod, formData)

  // Insert expense
  const expense = await createExpense({
    groupId,
    paidBy,
    amount: amount.toFixed(2),
    currency: group?.currency || 'USD',
    description: description.trim(),
    category,
    date,
    createdBy: user.id,
    isTransfer,
  })

  // Insert splits
  if (splits.length > 0) {
    await createExpenseSplits(
      expense.id,
      splits.map((split) => ({
        memberId: split.memberId,
        shareAmount: split.amount.toFixed(2),
      })),
    )
  }

  // Notify all other group members
  const actor = members.find((m) => m.userId === user.id)
  const actorName = actor?.displayName ?? 'Someone'
  const notifRecipients = members.filter((m) => m.userId && m.userId !== user.id)
  if (notifRecipients.length > 0) {
    await createExpenseAddedNotifications(
      notifRecipients.map((m) => ({
        userId: m.userId!,
        groupId,
        type: 'expense_added' as const,
        message: `${actorName} added "${description.trim()}" (${group?.currency ?? ''} ${amount.toFixed(2)})`,
        messageParams: {
          key: 'msg_expense_added',
          actor: actorName,
          description: description.trim(),
          currency: group?.currency ?? '',
          amount: amount.toFixed(2),
        },
      })),
    )
  }

  return expense
}

function calculateSplits(
  members: { id: string; defaultShare: number }[],
  totalAmount: number,
  method: 'equal' | 'amount' | 'shares' | 'percentage',
  formData: FormData,
): { memberId: string; amount: number }[] {
  switch (method) {
    case 'equal': {
      const totalShares = members.reduce((sum, m) => sum + m.defaultShare, 0)
      return members.map((m) => ({
        memberId: m.id,
        amount: (totalAmount * m.defaultShare) / totalShares,
      }))
    }
    case 'amount': {
      return members
        .map((m) => ({
          memberId: m.id,
          amount: parseFloat((formData.get(`split_${m.id}`) as string) || '0'),
        }))
        .filter((s) => s.amount > 0)
    }
    case 'shares': {
      const shares = members.map((m) => ({
        memberId: m.id,
        share: parseFloat((formData.get(`split_${m.id}`) as string) || '0'),
      }))
      const totalShares = shares.reduce((sum, s) => sum + s.share, 0)
      if (totalShares === 0) return []
      return shares
        .filter((s) => s.share > 0)
        .map((s) => ({
          memberId: s.memberId,
          amount: (totalAmount * s.share) / totalShares,
        }))
    }
    case 'percentage': {
      return members
        .map((m) => {
          const pct = parseFloat((formData.get(`split_${m.id}`) as string) || '0')
          return { memberId: m.id, amount: (totalAmount * pct) / 100 }
        })
        .filter((s) => s.amount > 0)
    }
  }
}
