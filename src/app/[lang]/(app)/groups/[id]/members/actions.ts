'use server'

import { db } from '@/db'
import { users, groupMembers, groups, notifications } from '@/db/schema'
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

  const [alreadyMember, group] = await Promise.all([
    existing
      ? db.query.groupMembers.findFirst({
          where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, existing.id)),
        })
      : Promise.resolve(null),
    db
      .select({ name: groups.name })
      .from(groups)
      .where(eq(groups.id, groupId))
      .then((r) => r[0]),
  ])

  if (!group) throw new Error('Group not found')

  if (alreadyMember) {
    if (!alreadyMember.isActive) {
      await db.update(groupMembers).set({ isActive: true }).where(eq(groupMembers.id, alreadyMember.id))
      await db.insert(notifications).values([
        {
          userId: existing!.id,
          groupId,
          type: 'member_added',
          message: `You were re-added to "${group.name}" by ${currentUser.displayName}`,
        },
        {
          userId: currentUser.id,
          groupId,
          type: 'member_added',
          message: `You re-added ${existing!.displayName} to "${group.name}"`,
        },
      ])
      revalidatePath(`/groups/${groupId}`)
      return { status: 'reactivated' as const }
    }
    return { status: 'already_member' as const }
  }

  const inviteeName = existing?.displayName ?? trimmed

  await db.insert(groupMembers).values({
    groupId,
    userId: existing?.id ?? null,
    displayName: inviteeName,
  })

  const notificationRows = [
    {
      userId: currentUser.id,
      groupId,
      type: 'member_added' as const,
      message: `You added ${inviteeName} to "${group.name}"`,
    },
    ...(existing
      ? [
          {
            userId: existing.id,
            groupId,
            type: 'member_added' as const,
            message: `You were added to "${group.name}" by ${currentUser.displayName}`,
          },
        ]
      : []),
  ]
  await db.insert(notifications).values(notificationRows)

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
