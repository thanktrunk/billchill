'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { revalidatePath } from 'next/cache'
import {
  createGroupMember,
  createMemberAddedNotifications,
  findGroupMemberByUser,
  findGroupName,
  findUserByEmail,
  reactivateGroupMember,
  setGroupMemberActive,
  updateGroupMember,
} from '@/db/mutations/group-members'

export async function inviteMember(groupId: string, email: string) {
  const currentUser = await requireUser()
  await verifyGroupMembership(groupId, currentUser.id)

  const trimmed = email.trim().toLowerCase()
  if (!trimmed) throw new Error('Email is required')

  const existing = await findUserByEmail(trimmed)

  const [alreadyMember, group] = await Promise.all([
    existing ? findGroupMemberByUser(groupId, existing.id) : Promise.resolve(null),
    findGroupName(groupId),
  ])

  if (!group) throw new Error('Group not found')

  if (alreadyMember) {
    if (!alreadyMember.isActive) {
      await reactivateGroupMember(alreadyMember.id)
      await createMemberAddedNotifications([
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

  await createGroupMember({
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
  await createMemberAddedNotifications(notificationRows)

  revalidatePath(`/groups/${groupId}`)
  return { status: existing ? ('linked' as const) : ('placeholder' as const) }
}

export async function updateMember(groupId: string, memberId: string, data: { displayName: string; defaultShare: number }) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await updateGroupMember(groupId, memberId, { displayName: data.displayName.trim(), defaultShare: data.defaultShare })

  revalidatePath(`/groups/${groupId}`)
}

export async function setMemberActive(groupId: string, memberId: string, isActive: boolean) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await setGroupMemberActive(groupId, memberId, isActive)

  revalidatePath(`/groups/${groupId}`)
}
