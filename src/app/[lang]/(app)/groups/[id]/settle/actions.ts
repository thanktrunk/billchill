'use server'

import { db } from '@/db'
import { settlements } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'

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
}
