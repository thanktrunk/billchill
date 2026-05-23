'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { BCSectionLabel, BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { updateGroup, archiveGroup } from '../settings/actions'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'VND', 'AUD', 'CAD', 'SGD']

export function SettingsTab({ group }: { group: { id: string; name: string; currency: string } }) {
  const locale = useLocale()
  const tGroup = useTranslations('group')
  const [name, setName] = useState(group.name)
  const [currency, setCurrency] = useState(group.currency)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)

  async function handleSave() {
    if (saving || !name.trim()) return
    setSaving(true)
    try {
      await updateGroup(group.id, { name, currency })
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (archiving) return
    setArchiving(true)
    try {
      await archiveGroup(locale, group.id)
    } catch {
      setArchiving(false)
      setConfirmArchive(false)
    }
  }

  return (
    <div className="flex flex-col gap-5.5">
      <div>
        <div className="px-1 pb-2">
          <BCSectionLabel>{tGroup('settings_name')}</BCSectionLabel>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-(--bc-softhair) outline-none bg-(--bc-surface) rounded-[14px] px-3.5 py-3 font-sans font-medium text-[15px] text-(--bc-ink) box-border"
        />
      </div>

      <div>
        <div className="px-1 pb-2">
          <BCSectionLabel>{tGroup('settings_currency')}</BCSectionLabel>
        </div>
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
        type="button"
        disabled={saving || !name.trim()}
        onClick={handleSave}
        className={cn(
          'bc-tap border-0 py-3.75 px-5.5 rounded-full font-sans font-medium text-base w-full flex items-center justify-center gap-2.5',
          name.trim() ? 'bg-(--bc-accent) text-white cursor-pointer' : 'bg-(--bc-chip) text-(--bc-muted) cursor-not-allowed',
          (saving || !name.trim()) && 'opacity-40',
        )}
      >
        <BCIcon name="check" size={18} color={name.trim() ? '#fff' : 'var(--bc-muted)'} strokeWidth={2.2} />
        {saving ? '…' : tGroup('settings_save')}
      </button>

      <div className="h-px bg-(--bc-softhair) my-1.5" />

      {confirmArchive ? (
        <div className="flex flex-col gap-2.5">
          <div className="font-sans text-sm text-(--bc-muted) text-center px-2 py-1">{tGroup('archive_confirm')}</div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmArchive(false)}
              className="bc-tap flex-1 border border-(--bc-softhair) bg-transparent text-(--bc-ink) py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px]"
            >
              {tGroup('archive_ok') === 'Archive' ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className={cn(
                'bc-tap flex-1 border-0 bg-[#E5572F] text-white py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px]',
                archiving && 'opacity-50',
              )}
            >
              {archiving ? '…' : tGroup('archive_ok')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmArchive(true)}
          className="bc-tap border border-(--bc-softhair) bg-transparent text-(--bc-neg) py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px] w-full"
        >
          {tGroup('archive_button')}
        </button>
      )}
    </div>
  )
}
