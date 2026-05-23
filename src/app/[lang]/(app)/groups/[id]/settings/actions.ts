'use server'

import { db } from '@/db'
import { groups } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateGroup(groupId: string, data: { name: string; currency: string }) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  const name = data.name.trim()
  if (!name) throw new Error('Group name is required')

  await db.update(groups).set({ name, currency: data.currency.toUpperCase() }).where(eq(groups.id, groupId))

  revalidatePath(`/groups/${groupId}`)
}

export async function archiveGroup(lang: string, groupId: string) {
  const user = await requireUser()
  await verifyGroupMembership(groupId, user.id)

  await db.update(groups).set({ archivedAt: new Date() }).where(eq(groups.id, groupId))

  redirect(`/${lang}/groups`)
}
