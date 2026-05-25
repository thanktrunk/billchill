import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { expenses, groupMembers, groups, settlements } from '@/db/schema'

export async function getProfileStatsData(userId: string) {
  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, memberId: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId))

  const groupIds = myMemberships.map((membership) => membership.groupId)
  const memberIds = myMemberships.map((membership) => membership.memberId)

  const [allExpenses, allGroups, allSettlements] = await Promise.all([
    groupIds.length
      ? db
          .select({ amount: expenses.amount, paidBy: expenses.paidBy, category: expenses.category, date: expenses.date })
          .from(expenses)
          .where(inArray(expenses.groupId, groupIds))
      : Promise.resolve([]),
    groupIds.length
      ? db
          .select({
            id: groups.id,
            name: groups.name,
            archivedAt: groups.archivedAt,
          })
          .from(groups)
          .where(inArray(groups.id, groupIds))
      : Promise.resolve([]),
    memberIds.length
      ? db.select({ amount: settlements.amount }).from(settlements).where(inArray(settlements.fromMember, memberIds))
      : Promise.resolve([]),
  ])

  return {
    allExpenses,
    allGroups,
    memberIds,
    allSettlements,
  }
}
