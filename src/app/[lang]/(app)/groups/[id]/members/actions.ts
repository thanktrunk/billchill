'use server'

import { db } from '@/db'
import { users, groupMembers } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function inviteMember(groupId: string, email: string) {
  const currentUser = await requireUser()
  await verifyGroupMembership(groupId, currentUser.id)

  const trimmed = email.trim().toLowerCase()
  if (!trimmed) throw new Error('Email is required')

  const existing = await db.query.users.findFirst({ where: eq(users.email, trimmed) })

  const alreadyMember = existing
    ? await db.query.groupMembers.findFirst({
        where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, existing.id)),
      })
    : null

  if (alreadyMember) {
    if (!alreadyMember.isActive) {
      await db.update(groupMembers).set({ isActive: true }).where(eq(groupMembers.id, alreadyMember.id))
      revalidatePath(`/groups/${groupId}`)
      return { status: 'reactivated' as const }
    }
    return { status: 'already_member' as const }
  }

  await db.insert(groupMembers).values({
    groupId,
    userId: existing?.id ?? null,
    displayName: existing?.displayName ?? trimmed,
  })

  revalidatePath(`/groups/${groupId}`)
  return { status: existing ? ('linked' as const) : ('placeholder' as const) }
}

export async function updateMember(groupId: string, memberId: string, data: { displayName: string; defaultShare: number }) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await db
    .update(groupMembers)
    .set({ displayName: data.displayName.trim(), defaultShare: data.defaultShare })
    .where(and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)))

  revalidatePath(`/groups/${groupId}`)
}

export async function setMemberActive(groupId: string, memberId: string, isActive: boolean) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await db
    .update(groupMembers)
    .set({ isActive })
    .where(and(eq(groupMembers.id, memberId), eq(groupMembers.groupId, groupId)))

  revalidatePath(`/groups/${groupId}`)
}
