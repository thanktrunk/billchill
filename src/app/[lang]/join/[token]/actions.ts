'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { findGroupByInviteToken } from '@/db/mutations/groups'
import {
  findGroupMemberByUser,
  createGroupMember,
  reactivateGroupMember,
  createMemberAddedNotifications,
  findActiveGroupMemberUserIds,
} from '@/db/mutations/group-members'

export async function joinGroupByToken(lang: string, token: string) {
  const user = await requireUser()

  const group = await findGroupByInviteToken(token)
  if (!group || !group.isPublic || group.archivedAt) {
    throw new Error('Invalid or expired invite link')
  }

  const existing = await findGroupMemberByUser(group.id, user.id)

  if (existing) {
    if (!existing.isActive) {
      await reactivateGroupMember(existing.id)
    }
  } else {
    await createGroupMember({ groupId: group.id, userId: user.id, displayName: user.displayName })

    const activeUserIds = await findActiveGroupMemberUserIds(group.id)
    const notifRows = activeUserIds
      .filter((uid) => uid !== user.id)
      .map((uid) => ({
        userId: uid,
        groupId: group.id,
        type: 'member_added' as const,
        message: `${user.displayName} joined "${group.name}"`,
      }))
    if (notifRows.length) await createMemberAddedNotifications(notifRows)
  }

  redirect(`/${lang}/groups/${group.id}`)
}
