'use client'

import { useState, useTransition, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { BCAvatar, BCIcon } from '@/components/bc-ui'
import { updateDisplayName } from './actions'
import { cn, AVATAR_MAX_BYTES } from '@/lib/utils'

interface Props {
  displayName: string
  userId: string
  email: string
  avatarUrl?: string | null
  labels: {
    edit: string
    save: string
    cancel: string
    changeAvatar: string
    uploadingAvatar: string
    avatarTooLarge: string
    avatarBadType: string
    avatarUploadError: string
  }
}

export function ProfileNameEditor({ displayName, userId, email, avatarUrl, labels }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(displayName)
  const [current, setCurrent] = useState(displayName)
  const [isPending, startTransition] = useTransition()
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locale = useLocale()
  const router = useRouter()

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

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    if (!file.type.startsWith('image/')) {
      setAvatarError(labels.avatarBadType)
      e.target.value = ''
      return
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError(labels.avatarTooLarge)
      e.target.value = ''
      return
    }

    setIsUploading(true)
    const preview = URL.createObjectURL(file)
    setCurrentAvatarUrl(preview)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.error === 'too_large') {
          setAvatarError(labels.avatarTooLarge)
        } else if (body.error === 'bad_type') {
          setAvatarError(labels.avatarBadType)
        } else {
          setAvatarError(labels.avatarUploadError)
        }
        setCurrentAvatarUrl(avatarUrl)
      } else {
        const { url } = await res.json()
        setCurrentAvatarUrl(url)
        router.refresh()
      }
    } catch {
      setAvatarError(labels.avatarUploadError)
      setCurrentAvatarUrl(avatarUrl)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative block rounded-full cursor-pointer bg-transparent border-0 p-0"
          aria-label={labels.changeAvatar}
        >
          <BCAvatar name={current} seed={userId} size={56} avatarUrl={currentAvatarUrl} />
          {isUploading && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-bc-spin" />
            </div>
          )}
        </button>
        <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-(--bc-chip) border border-(--bc-softhair) flex items-center justify-center pointer-events-none">
          <BCIcon name="camera" size={11} color="var(--bc-muted)" strokeWidth={1.8} />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={onFileChange} />
      </div>

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
        {avatarError && <div className="font-sans text-[12px] text-(--bc-neg) mt-1">{avatarError}</div>}
      </div>
    </div>
  )
}
