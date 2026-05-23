'use server'

import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { archiveGroupById, updateGroupSettings } from '@/db/mutations/groups'

export async function updateGroup(groupId: string, data: { name: string; currency: string }) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const name = data.name.trim()
  if (!name) throw new Error('Group name is required')

  await updateGroupSettings(groupId, { name, currency: data.currency.toUpperCase() })

  revalidatePath(`/groups/${groupId}`)
}

export async function archiveGroup(lang: string, groupId: string) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await archiveGroupById(groupId)

  redirect(`/${lang}/groups`)
}
