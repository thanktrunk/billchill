import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { hasLocale } from '@/lib/i18n'
import { NewExpenseForm } from './new-expense-form'
import { getNewExpensePageData } from '@/db/queries/groups'

export default async function NewExpensePage({ params }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const { group, members } = await getNewExpensePageData(id)

  if (!group) notFound()

  return <NewExpenseForm groupId={id} groupName={group.name} currency={group.currency} members={members} currentUserId={user.id} />
}
