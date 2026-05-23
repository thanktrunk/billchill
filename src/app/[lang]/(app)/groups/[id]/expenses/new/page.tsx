import { notFound } from 'next/navigation'
import { db } from '@/db'
import { groups, groupMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { hasLocale } from '@/lib/i18n'
import { NewExpenseForm } from './new-expense-form'

export default async function NewExpensePage({ params }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const [group, members] = await Promise.all([
    db.query.groups.findFirst({ where: eq(groups.id, id) }),
    db
      .select({ id: groupMembers.id, displayName: groupMembers.displayName, defaultShare: groupMembers.defaultShare })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.isActive, true))),
  ])

  if (!group) notFound()

  return <NewExpenseForm groupId={id} groupName={group.name} currency={group.currency} members={members} />
}
