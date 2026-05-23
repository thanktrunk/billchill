'use client'

import { useState, useTransition, useRef } from 'react'
import { useLocale } from 'next-intl'
import { BCAvatar, BCIcon } from '@/components/bc-ui'
import { updateDisplayName } from './actions'
import { cn } from '@/lib/utils'

interface Props {
  displayName: string
  userId: string
  email: string
  avatarUrl?: string | null
  labels: { edit: string; save: string; cancel: string }
}

export function ProfileNameEditor({ displayName, userId, email, avatarUrl, labels }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(displayName)
  const [current, setCurrent] = useState(displayName)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const locale = useLocale()

  function startEditing() {
    setValue(current)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function cancel() {
    setEditing(false)
    setValue(current)
  }

  function save() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === current) {
      cancel()
      return
    }
    startTransition(async () => {
      await updateDisplayName(locale, trimmed)
      setCurrent(trimmed)
      setEditing(false)
    })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="flex items-center gap-3.5">
      <BCAvatar name={current} seed={userId} size={56} avatarUrl={avatarUrl} />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isPending}
              className="flex-1 font-sans font-medium text-[17px] text-(--bc-ink) tracking-[-0.005em] bg-(--bc-chip) border-0 rounded-lg px-2 py-1 outline-none min-w-0"
            />
            <button
              onClick={save}
              disabled={isPending || !value.trim()}
              className={cn('bg-transparent border-0 p-1 cursor-pointer', isPending && 'opacity-50')}
              aria-label={labels.save}
            >
              <BCIcon name="check" size={18} color="var(--bc-pos)" strokeWidth={2} />
            </button>
            <button onClick={cancel} disabled={isPending} className="bg-transparent border-0 p-1 cursor-pointer" aria-label={labels.cancel}>
              <BCIcon name="close" size={18} color="var(--bc-muted)" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5"
            aria-label={labels.edit}
          >
            <span className="font-sans font-medium text-[17px] text-(--bc-ink) tracking-[-0.005em]">{current}</span>
            <BCIcon name="edit" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
          </button>
        )}
        <div className="font-sans text-[13px] text-(--bc-muted) mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{email}</div>
      </div>
    </div>
  )
}
