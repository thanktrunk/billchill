'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { setUserDisplayName, setUserPreferredCurrency } from '@/db/mutations/profile'

export async function updateDisplayName(lang: string, name: string) {
  const user = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  await setUserDisplayName(user.id, trimmed)

  revalidatePath(`/${lang}/profile`)
}

export async function updatePreferredCurrency(lang: string, currency: string) {
  const user = await requireUser()
  const code = currency.trim().toUpperCase().slice(0, 3)
  if (!code) throw new Error('Currency is required')

  await setUserPreferredCurrency(user.id, code)

  revalidatePath(`/${lang}/profile`)
}
