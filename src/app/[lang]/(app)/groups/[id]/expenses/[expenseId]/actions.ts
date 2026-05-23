'use server'

import { db } from '@/db'
import { expenses, expenseSplits, groupMembers } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getExpenseDetail(expenseId: string) {
  const user = await requireUser()

  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) })
  if (!expense) return null

  await verifyGroupMembership(expense.groupId, user.id)

  const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId))
  const memberIds = splits.map((s) => s.memberId)
  const members = memberIds.length
    ? await db
        .select({ id: groupMembers.id, displayName: groupMembers.displayName })
        .from(groupMembers)
        .where(inArray(groupMembers.id, memberIds))
    : []

  return { expense, splits, members }
}

export async function updateExpense(
  lang: string,
  expenseId: string,
  data: {
    description: string
    amount: string
    paidBy: string
    date: string
    category: string | null
    splits: { memberId: string; shareAmount: string }[]
  },
) {
  const user = await requireUser()

  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) })
  if (!expense) throw new Error('Expense not found')

  await verifyGroupMembership(expense.groupId, user.id)

  await db
    .update(expenses)
    .set({
      description: data.description.trim(),
      amount: data.amount,
      paidBy: data.paidBy,
      date: data.date,
      category: data.category,
    })
    .where(and(eq(expenses.id, expenseId)))

  await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId))

  if (data.splits.length > 0) {
    await db.insert(expenseSplits).values(
      data.splits.map((s) => ({
        expenseId,
        memberId: s.memberId,
        shareAmount: s.shareAmount,
      })),
    )
  }

  revalidatePath(`/${lang}/groups/${expense.groupId}`)
  revalidatePath(`/${lang}/groups/${expense.groupId}/expenses/${expenseId}`)
}

export async function deleteExpense(lang: string, expenseId: string) {
  const user = await requireUser()

  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) })
  if (!expense) throw new Error('Expense not found')

  await verifyGroupMembership(expense.groupId, user.id)

  await db.delete(expenses).where(eq(expenses.id, expenseId))

  redirect(`/${lang}/groups/${expense.groupId}`)
}
