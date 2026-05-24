import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { expenseSplits, expenses, groupMembers } from '@/db/schema'

export async function getExpenseDetailData(expenseId: string) {
  const expense = await db.query.expenses.findFirst({ where: and(eq(expenses.id, expenseId), isNull(expenses.deletedAt)) })
  if (!expense) return null

  const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId))
  const memberIds = splits.map((split) => split.memberId)

  const members = memberIds.length
    ? await db
        .select({ id: groupMembers.id, displayName: groupMembers.displayName })
        .from(groupMembers)
        .where(inArray(groupMembers.id, memberIds))
    : []

  return {
    expense,
    splits,
    members,
  }
}
