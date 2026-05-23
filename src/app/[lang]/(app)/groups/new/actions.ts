'use server'

import { requireUser } from '@/lib/auth'
import { createGroupWithOwner } from '@/db/mutations/groups'

export async function createGroup(formData: FormData) {
  const user = await requireUser()
  const name = formData.get('name') as string
  const currency = formData.get('currency') as string

  if (!name?.trim()) {
    throw new Error('Group name is required')
  }

  return createGroupWithOwner(user, {
    name: name.trim(),
    currency: currency || 'USD',
  })
}
