'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { deleteExpenseById, findExpenseById, replaceExpenseSplits, updateExpenseById } from '@/db/mutations/expenses'
import { getExpenseDetailData } from '@/db/queries/expenses'

export async function getExpenseDetail(expenseId: string) {
  const user = await requireUser()

  const detail = await getExpenseDetailData(expenseId)
  if (!detail) return null

  await verifyGroupMembership(detail.expense.groupId, user.id)

  return detail
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

  const expense = await findExpenseById(expenseId)
  if (!expense) throw new Error('Expense not found')

  await verifyGroupMembership(expense.groupId, user.id)

  await updateExpenseById(expenseId, {
    description: data.description.trim(),
    amount: data.amount,
    paidBy: data.paidBy,
    date: data.date,
    category: data.category,
  })

  await replaceExpenseSplits(expenseId, data.splits)

  revalidatePath(`/${lang}/groups/${expense.groupId}`)
  revalidatePath(`/${lang}/groups/${expense.groupId}/expenses/${expenseId}`)
}

export async function deleteExpense(lang: string, expenseId: string) {
  const user = await requireUser()

  const expense = await findExpenseById(expenseId)
  if (!expense) throw new Error('Expense not found')

  await verifyGroupMembership(expense.groupId, user.id)

  await deleteExpenseById(expenseId)

  redirect(`/${lang}/groups/${expense.groupId}`)
}
