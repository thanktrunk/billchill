'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createGroup } from './actions'
import { BCTopBar, BCIconBtn } from '@/components/bc-ui'
import { useTranslations, useLocale } from 'next-intl'
import { CURRENCIES } from '@/lib/currency'
import { cn } from '@/lib/utils'

export function NewGroupForm({ defaultCurrency = 'USD' }: { defaultCurrency?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('new_group')
  const [pending, setPending] = useState(false)
  const [currency, setCurrency] = useState(defaultCurrency)

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
          <div className="block text-sm font-medium mb-1">{t('currency_label')}</div>
          <input type="hidden" name="currency" value={currency} />
          <div className="flex gap-2 flex-wrap">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={cn(
                  'bc-tap border-0 px-4 py-2 rounded-full cursor-pointer font-mono font-medium text-[13px] tracking-[0.04em]',
                  currency === c ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
                )}
              >
                {c}
              </button>
            ))}
          </div>
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
