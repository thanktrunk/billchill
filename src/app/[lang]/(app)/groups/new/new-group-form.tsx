'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createGroup } from './actions'
import { CurrencyInput } from '@/components/currency-input'
import { useTranslations, useLocale } from 'next-intl'

export function NewGroupForm() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('new_group')
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (pending) return
    setPending(true)
    try {
      const group = await createGroup(formData)
      router.push(`/${locale}/groups/${group.id}`)
    } catch {
      setPending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {t('name_label')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder={t('name_placeholder')}
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-1">
            {t('currency_label')}
          </label>
          <CurrencyInput defaultValue="USD" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}
