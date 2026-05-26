'use client'

import { useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { BCSectionLabel, BCIcon, BCGroupGlyph } from '@/components/bc-ui'
import { cn, AVATAR_MAX_BYTES } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { updateGroup, archiveGroup, toggleGroupVisibility } from '../settings/actions'
import { MembersTab } from './members-tab'
import { CURRENCIES } from '@/lib/currency'

type AllMember = {
  id: string
  displayName: string
  userId: string | null
  defaultShare: number
  isActive: boolean
  avatarUrl?: string | null
  userEmail?: string | null
  userName?: string | null
}

export function SettingsTab({
  group,
  allMembers,
}: {
  group: { id: string; name: string; currency: string; isPublic: boolean; inviteToken: string | null; imageUrl?: string | null }
  allMembers: AllMember[]
}) {
  const locale = useLocale()
  const tGroup = useTranslations('group')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(group.name)
  const [currency, setCurrency] = useState(group.currency)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [isPublic, setIsPublic] = useState(group.isPublic)
  const [inviteToken, setInviteToken] = useState(group.inviteToken)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(group.imageUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  async function handleToggleVisibility() {
    if (togglingVisibility) return
    setTogglingVisibility(true)
    try {
      const next = !isPublic
      const result = await toggleGroupVisibility(group.id, next, inviteToken)
      setIsPublic(next)
      setInviteToken(result.token)
    } finally {
      setTogglingVisibility(false)
    }
  }

  async function handleCopyLink() {
    if (!inviteToken) return
    const url = `${window.location.origin}/${locale}/join/${inviteToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (saving || !name.trim()) return
    setSaving(true)
    try {
      await updateGroup(group.id, { name, currency })
    } finally {
      setSaving(false)
    }
  }

  async function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)

    if (!file.type.startsWith('image/')) {
      setImageError(tGroup('image_bad_type'))
      e.target.value = ''
      return
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setImageError(tGroup('image_too_large'))
      e.target.value = ''
      return
    }

    setIsUploading(true)
    setCurrentImageUrl(URL.createObjectURL(file))

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/upload/group-image/${group.id}`, { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setImageError(
          body.error === 'too_large'
            ? tGroup('image_too_large')
            : body.error === 'bad_type'
              ? tGroup('image_bad_type')
              : tGroup('image_upload_error'),
        )
        setCurrentImageUrl(group.imageUrl ?? null)
      } else {
        const { url } = await res.json()
        setCurrentImageUrl(url)
        router.refresh()
      }
    } catch {
      setImageError(tGroup('image_upload_error'))
      setCurrentImageUrl(group.imageUrl ?? null)
    } finally {
      setIsUploading(false)
      e.target.value = ''
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
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="relative block rounded-[18px] cursor-pointer bg-transparent border-0 p-0"
            aria-label={tGroup('image_change')}
          >
            <BCGroupGlyph name={group.name} size={72} imageUrl={currentImageUrl} />
            {isUploading && (
              <div className="absolute inset-0 rounded-[18px] flex items-center justify-center bg-black/40">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-bc-spin" />
              </div>
            )}
          </button>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-(--bc-chip) border border-(--bc-softhair) flex items-center justify-center pointer-events-none">
            <BCIcon name="camera" size={13} color="var(--bc-muted)" strokeWidth={1.8} />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={onImageFileChange} />
        </div>
        {imageError && <div className="font-sans text-[12px] text-(--bc-neg)">{imageError}</div>}
      </div>

      <MembersTab groupId={group.id} allMembers={allMembers} />

      <div className="h-px bg-(--bc-softhair)" />

      <div>
        <div className="px-1 pb-2">
          <BCSectionLabel>{tGroup('visibility_label')}</BCSectionLabel>
        </div>
        <div
          className={cn(
            'w-full flex items-center justify-between gap-3 border border-(--bc-softhair) rounded-[14px] px-3.5 py-3',
            togglingVisibility && 'opacity-50',
          )}
        >
          <div className="text-left">
            <div className="font-sans font-medium text-[15px] text-(--bc-ink)">
              {isPublic ? tGroup('visibility_public') : tGroup('visibility_private')}
            </div>
            <div className="font-sans text-[12px] text-(--bc-muted) mt-0.5">
              {isPublic ? tGroup('visibility_hint_public') : tGroup('visibility_hint_private')}
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={handleToggleVisibility} disabled={togglingVisibility} />
        </div>

        {isPublic && inviteToken && (
          <div className="mt-2 flex items-center gap-2 border border-(--bc-softhair) rounded-[14px] px-3.5 py-2.5">
            <div className="flex-1 font-mono text-[12px] text-(--bc-muted) truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/${locale}/join/${inviteToken}` : `…/join/${inviteToken}`}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="bc-tap shrink-0 font-sans font-medium text-[13px] text-(--bc-accent) cursor-pointer border-0 bg-transparent px-1"
            >
              {copied ? tGroup('link_copied') : tGroup('copy_link')}
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-(--bc-softhair)" />

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
