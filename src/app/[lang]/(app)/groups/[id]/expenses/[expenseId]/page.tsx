import { notFound } from 'next/navigation'
import { db } from '@/db'
import { groupMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { hasLocale } from '@/lib/i18n'
import { getExpenseDetail } from './actions'
import { ExpenseDetailClient } from './expense-detail-client'

export default async function ExpenseDetailPage({ params }: PageProps) {
  const { lang, id, expenseId } = await params
  if (!hasLocale(lang)) notFound()

  const detail = await getExpenseDetail(expenseId)
  if (!detail) notFound()

  const allMembers = await db
    .select({ id: groupMembers.id, displayName: groupMembers.displayName, defaultShare: groupMembers.defaultShare })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, id), eq(groupMembers.isActive, true)))

  const serializedExpense = {
    id: detail.expense.id,
    groupId: detail.expense.groupId,
    description: detail.expense.description,
    amount: detail.expense.amount,
    currency: detail.expense.currency,
    category: detail.expense.category,
    date: detail.expense.date,
    paidBy: detail.expense.paidBy,
    createdAt: detail.expense.createdAt.toISOString(),
  }

  const serializedSplits = detail.splits.map((s) => ({
    memberId: s.memberId,
    shareAmount: s.shareAmount,
  }))

  return <ExpenseDetailClient lang={lang} groupId={id} expense={serializedExpense} splits={serializedSplits} allMembers={allMembers} />
}
