import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { expenseSplits, expenses, groups, groupMembers, notifications } from '@/db/schema'

export async function findGroupById(groupId: string) {
  return db.query.groups.findFirst({ where: eq(groups.id, groupId) })
}

export async function findActiveGroupMembers(groupId: string) {
  return db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))
}

export async function createExpense(data: {
  groupId: string
  paidBy: string
  amount: string
  currency: string
  description: string
  category: string | null
  date: string
  createdBy: string
}) {
  const [expense] = await db.insert(expenses).values(data).returning()
  return expense
}

export async function replaceExpenseSplits(expenseId: string, splits: { memberId: string; shareAmount: string }[]) {
  await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId))

  if (!splits.length) return

  await db.insert(expenseSplits).values(
    splits.map((split) => ({
      expenseId,
      memberId: split.memberId,
      shareAmount: split.shareAmount,
    })),
  )
}

export async function createExpenseSplits(expenseId: string, splits: { memberId: string; shareAmount: string }[]) {
  if (!splits.length) return

  await db.insert(expenseSplits).values(
    splits.map((split) => ({
      expenseId,
      memberId: split.memberId,
      shareAmount: split.shareAmount,
    })),
  )
}

export async function createExpenseAddedNotifications(rows: { userId: string; groupId: string; type: 'expense_added'; message: string }[]) {
  if (!rows.length) return
  await db.insert(notifications).values(rows)
}

export async function findExpenseById(expenseId: string) {
  return db.query.expenses.findFirst({ where: and(eq(expenses.id, expenseId), isNull(expenses.deletedAt)) })
}

export async function updateExpenseById(
  expenseId: string,
  data: {
    description: string
    amount: string
    paidBy: string
    date: string
    category: string | null
  },
) {
  await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, expenseId)))
}

export async function deleteExpenseById(expenseId: string, deletedBy: string) {
  await db.update(expenses).set({ deletedAt: new Date(), deletedBy }).where(eq(expenses.id, expenseId))
}
