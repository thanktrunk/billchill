'use server'

import { db } from '@/db'
import { groups, groupMembers, notifications } from '@/db/schema'
import { requireUser } from '@/lib/auth'

export async function createGroup(formData: FormData) {
  const user = await requireUser()
  const name = formData.get('name') as string
  const currency = formData.get('currency') as string

  if (!name?.trim()) {
    throw new Error('Group name is required')
  }

  const [group] = await db
    .insert(groups)
    .values({
      name: name.trim(),
      currency: currency || 'USD',
      createdBy: user.id,
    })
    .returning()

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: user.id,
    displayName: user.displayName,
  })

  await db.insert(notifications).values({
    userId: user.id,
    groupId: group.id,
    type: 'member_added',
    message: `You created the group "${name.trim()}"`,
  })

  return group
}
