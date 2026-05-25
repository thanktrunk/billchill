'use server'

import { requireUser } from '@/lib/auth'
import { setGroupMemberStarred } from '@/db/mutations/groups'
import { db } from '@/db'
import { groupMembers } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function toggleGroupStarAction(groupId: string, lang: string) {
  const user = await requireUser()

  const [membership] = await db
    .select({ id: groupMembers.id, starredAt: groupMembers.starredAt })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  if (!membership) return

  await setGroupMemberStarred(membership.id, !membership.starredAt)
  revalidatePath(`/${lang}/groups`)
}
