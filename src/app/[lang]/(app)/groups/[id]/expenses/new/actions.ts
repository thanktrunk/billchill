'use server'

import { db } from '@/db'
import { expenses, expenseSplits, groups, groupMembers } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { eq, and } from 'drizzle-orm'

export async function getGroupMembers(groupId: string) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const members = await db
    .select({ id: groupMembers.id, displayName: groupMembers.displayName })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))

  return members
}

export async function addExpense(groupId: string, formData: FormData, splitMethod: 'equal' | 'amount' | 'shares' | 'percentage') {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paidBy = formData.get('paidBy') as string
  const date = formData.get('date') as string

  if (!description?.trim() || !amount || !paidBy || !date) {
    throw new Error('All fields are required')
  }

  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }

  // Get group info for currency
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  })

  // Get active members for splitting
  const members = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))

  // Calculate splits
  const splits = calculateSplits(members, amount, splitMethod, formData)

  // Insert expense
  const [expense] = await db
    .insert(expenses)
    .values({
      groupId,
      paidBy,
      amount: amount.toFixed(2),
      currency: group?.currency || 'USD',
      description: description.trim(),
      date,
      createdBy: user.id,
    })
    .returning()

  // Insert splits
  if (splits.length > 0) {
    await db.insert(expenseSplits).values(
      splits.map((split) => ({
        expenseId: expense.id,
        memberId: split.memberId,
        shareAmount: split.amount.toFixed(2),
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
