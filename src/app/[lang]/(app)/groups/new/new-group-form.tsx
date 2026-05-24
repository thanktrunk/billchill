'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createGroup } from './actions'
import { CurrencyInput } from '@/components/currency-input'
import { BCTopBar, BCIconBtn } from '@/components/bc-ui'
import { useTranslations, useLocale } from 'next-intl'

export function NewGroupForm({ defaultCurrency = 'USD' }: { defaultCurrency?: string }) {
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
    <div className="container mx-auto max-w-md">
      <BCTopBar title={t('title')} left={<BCIconBtn name="back" onClick={() => router.push(`/${locale}/groups`)} />} />
      <form action={handleSubmit} className="space-y-4 px-4 py-4">
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
          <CurrencyInput defaultValue={defaultCurrency} />
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
