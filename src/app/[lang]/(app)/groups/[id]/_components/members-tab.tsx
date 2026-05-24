'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { BCCard, BCSectionLabel, BCAvatar, BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { inviteMember, updateMember, setMemberActive, searchUsers } from '../members/actions'

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

type AppUserSuggestion = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
}

export function MembersTab({ groupId, allMembers }: { groupId: string; allMembers: AllMember[] }) {
  const tGroup = useTranslations('group')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editShare, setEditShare] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [suggestions, setSuggestions] = useState<AppUserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [, startTransition] = useTransition()
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  function handleInviteInputChange(value: string) {
    setInviteInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(q)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 300)
  }

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  function startEdit(m: AllMember) {
    setEditingId(m.id)
    setEditName(m.displayName)
    setEditShare(String(m.defaultShare))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(m: AllMember) {
    const name = editName.trim()
    const share = parseInt(editShare) || 1
    if (!name) return
    startTransition(async () => {
      await updateMember(groupId, m.id, { displayName: name, defaultShare: share })
      setEditingId(null)
    })
  }

  function toggleActive(m: AllMember) {
    startTransition(async () => {
      await setMemberActive(groupId, m.id, !m.isActive)
    })
  }

  function selectSuggestion(user: AppUserSuggestion) {
    setInviteInput(user.email)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function handleInvite() {
    if (!inviteInput.trim()) return
    const input = inviteInput.trim()
    startTransition(async () => {
      await inviteMember(groupId, input)
      setInviteInput('')
      setSuggestions([])
      setShowSuggestions(false)
    })
  }

  return (
    <div className="flex flex-col gap-4.5">
      <BCCard padded={false}>
        {allMembers.map((m, i) => (
          <div key={m.id}>
            <div
              className={cn('flex items-center gap-3 px-3.5 py-3', i > 0 && 'border-t border-(--bc-softhair)', !m.isActive && 'opacity-50')}
            >
              <BCAvatar name={m.displayName} seed={m.id} size={36} avatarUrl={m.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="font-sans font-medium text-[14.5px] text-(--bc-ink) flex items-center gap-2">
                  {m.displayName}
                  {!m.isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-(--bc-chip) text-(--bc-muted) tracking-[0.08em]">
                      {tGroup('member_inactive_label')}
                    </span>
                  )}
                </div>
                {m.userId && (m.userName || m.userEmail) && (
                  <div className="font-sans text-[11px] text-(--bc-muted) mt-0.5 truncate">
                    {m.userName && m.userName !== m.displayName ? m.userName : m.userEmail}
                  </div>
                )}
                <div className="font-mono text-[11px] text-(--bc-muted) mt-0.5 tracking-[0.04em]">
                  {tGroup('member_share_label')}: {m.defaultShare}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="bc-tap border-0 bg-(--bc-chip) text-(--bc-ink) px-3 py-1.5 rounded-full cursor-pointer font-sans text-xs"
                >
                  <BCIcon name="settings" size={14} color="var(--bc-ink)" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(m)}
                  className={cn(
                    'bc-tap border-0 px-3 py-1.5 rounded-full cursor-pointer font-sans text-xs font-medium',
                    m.isActive ? 'bg-transparent text-(--bc-neg)' : 'bg-(--bc-chip) text-(--bc-pos)',
                  )}
                >
                  {m.isActive ? tGroup('member_deactivate') : tGroup('member_reactivate')}
                </button>
              </div>
            </div>
            {editingId === m.id && (
              <div className="px-3.5 py-3 border-t border-(--bc-softhair) bg-(--bc-surface) flex flex-col gap-2.5">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Display name"
                  className="border border-(--bc-softhair) outline-none bg-(--bc-bg) rounded-[10px] px-3 py-2 font-sans text-sm text-(--bc-ink) w-full box-border"
                />
                <div className="flex items-center gap-2.5">
                  <div className="font-sans text-xs text-(--bc-muted) whitespace-nowrap">{tGroup('member_share_label')}</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={editShare}
                    onChange={(e) => setEditShare(e.target.value)}
                    className="w-16 border border-(--bc-softhair) outline-none bg-(--bc-bg) rounded-[10px] px-3 py-2 font-mono text-[13px] text-(--bc-ink) text-right"
                  />
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bc-tap border border-(--bc-softhair) bg-transparent text-(--bc-muted) px-3.5 py-2 rounded-full cursor-pointer font-sans text-[13px]"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(m)}
                    className="bc-tap border-0 bg-(--bc-ink) text-(--bc-bg) px-3.5 py-2 rounded-full cursor-pointer font-sans text-[13px] font-medium"
                  >
                    {tGroup('save_member')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </BCCard>

      <div>
        <div className="px-1 pb-2">
          <BCSectionLabel>{tGroup('invite_section')}</BCSectionLabel>
        </div>
        <div className="flex gap-2.5" ref={wrapperRef}>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => handleInviteInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={tGroup('invite_placeholder')}
              className="w-full border border-(--bc-softhair) outline-none bg-(--bc-surface) rounded-[14px] px-3.5 py-3 font-sans text-sm text-(--bc-ink)"
            />
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-(--bc-surface) border border-(--bc-softhair) rounded-[14px] overflow-hidden z-10 shadow-sm">
                {suggestions.map((u, i) => (
                  <button
                    key={u.id}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      selectSuggestion(u)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:bg-(--bc-chip) cursor-pointer',
                      i > 0 && 'border-t border-(--bc-softhair)',
                    )}
                  >
                    <BCAvatar name={u.displayName} seed={u.id} size={32} avatarUrl={u.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-medium text-[13.5px] text-(--bc-ink) truncate">{u.displayName}</div>
                      <div className="font-sans text-[11px] text-(--bc-muted) truncate">{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!inviteInput.trim()}
            className={cn(
              'bc-tap border-0 px-5 py-3 rounded-[14px] font-sans font-medium text-sm whitespace-nowrap',
              inviteInput.trim() ? 'bg-(--bc-ink) text-(--bc-bg) cursor-pointer' : 'bg-(--bc-chip) text-(--bc-muted) cursor-not-allowed',
            )}
          >
            {tGroup('invite_button')}
          </button>
        </div>
      </div>
    </div>
  )
}
