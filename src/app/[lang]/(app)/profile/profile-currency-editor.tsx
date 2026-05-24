'use client'

import { useState, useTransition } from 'react'
import { useLocale } from 'next-intl'
import { BCIcon } from '@/components/bc-ui'
import { updatePreferredCurrency } from './actions'
import { cn } from '@/lib/utils'
import { CURRENCIES } from '@/lib/currency'

interface Props {
  preferredCurrency: string
  label: string
  saveLabel: string
  cancelLabel: string
}

export function ProfileCurrencyEditor({ preferredCurrency, label, saveLabel, cancelLabel }: Props) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState(preferredCurrency)
  const [selected, setSelected] = useState(preferredCurrency)
  const [isPending, startTransition] = useTransition()
  const locale = useLocale()

  function startEditing() {
    setSelected(current)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setSelected(current)
  }

  function save() {
    if (selected === current) {
      cancel()
      return
    }
    startTransition(async () => {
      await updatePreferredCurrency(locale, selected)
      setCurrent(selected)
      setEditing(false)
    })
  }

  return (
    <div className={cn('flex items-center justify-between px-4.5 py-3.5 border-t border-(--bc-softhair)')}>
      <div className="font-sans text-[15px] text-(--bc-ink)">{label}</div>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelected(c)}
                disabled={isPending}
                className={cn(
                  'font-sans text-[13px] font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer',
                  selected === c ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={save}
            disabled={isPending}
            className={cn('bg-transparent border-0 p-1 cursor-pointer', isPending && 'opacity-50')}
            aria-label={saveLabel}
          >
            <BCIcon name="check" size={18} color="var(--bc-pos)" strokeWidth={2} />
          </button>
          <button onClick={cancel} disabled={isPending} className="bg-transparent border-0 p-1 cursor-pointer" aria-label={cancelLabel}>
            <BCIcon name="close" size={18} color="var(--bc-muted)" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button onClick={startEditing} className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer">
          <div className="font-sans text-sm text-(--bc-muted)">{current}</div>
          <BCIcon name="arrowR" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
        </button>
      )}
    </div>
  )
}
