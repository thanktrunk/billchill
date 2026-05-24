'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Avatar color palette (stable hash) ───────────────────────────
export const AVATAR_COLORS = ['#E5572F', '#3F6E55', '#B7873A', '#7B5E8C', '#4A6B7C', '#A4452C', '#5B6E3F', '#8C5E3E']
export function avatarColor(seed: string | number): string {
  const s = typeof seed === 'string' ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : seed
  return AVATAR_COLORS[Math.abs(s) % AVATAR_COLORS.length]
}

// ── Category config ───────────────────────────────────────────────
export const BC_CATEGORIES: Record<string, { labelKey: string; glyph: string; tint: string }> = {
  food: { labelKey: 'cat.food', glyph: 'F', tint: '#E5572F' },
  drinks: { labelKey: 'cat.drinks', glyph: 'D', tint: '#7B5E8C' },
  transport: { labelKey: 'cat.transport', glyph: 'T', tint: '#4A6B7C' },
  lodging: { labelKey: 'cat.lodging', glyph: 'L', tint: '#B7873A' },
  groceries: { labelKey: 'cat.groceries', glyph: 'G', tint: '#3F6E55' },
  fun: { labelKey: 'cat.fun', glyph: 'E', tint: '#A4452C' },
  utilities: { labelKey: 'cat.utilities', glyph: 'U', tint: '#5B6E3F' },
  other: { labelKey: 'cat.other', glyph: '·', tint: '#6B6359' },
}

// ── SVG Icon ──────────────────────────────────────────────────────
const ICON_PATHS: Record<string, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M19 12H5M12 5l-7 7 7 7" />,
  arrowR: <path d="M5 12h14M12 5l7 7-7 7" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5L20 7" />,
  bell: <path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" />,
  user: <path d="M20 21a8 8 0 10-16 0M16 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  users: (
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm9 0a3 3 0 100-6 3 3 0 000 6zm4 10v-2a4 4 0 00-3-3.87" />
  ),
  dots: (
    <g>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </g>
  ),
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4" />,
  settings: (
    <path d="M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.5-2.4 1a7.6 7.6 0 00-1.7-1L15 3h-4l-.3 2.4a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.5 2.4-1a7.6 7.6 0 001.7 1L11 21h4l.3-2.4a7.6 7.6 0 001.7-1l2.4 1 2-3.5L19.4 13z" />
  ),
  archive: <path d="M3 7h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 7zM3 3h18v4H3zM10 11h4" />,
  minus: <path d="M5 12h14" />,
  swap: <path d="M7 4l-3 3 3 3M4 7h11M17 14l3 3-3 3M20 17H9" />,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  home: <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-3v-7H8v7H5a2 2 0 01-2-2v-9z" />,
  tag: <path d="M3 12l9-9h8v8l-9 9zM15 9a1 1 0 100-2 1 1 0 000 2z" />,
  arrowLeft: <path d="M19 12H5m7-7l-7 7 7 7" />,
  edit: <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M17.5 2.5a2.121 2.121 0 013 3L12 14l-4 1 1-4 7.5-7.5z" />,
}

export function BCIcon({
  name,
  size = 22,
  color = 'currentColor',
  strokeWidth = 1.6,
  className,
}: {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

// ── Avatar ────────────────────────────────────────────────────────
export function BCAvatar({
  name = '?',
  seed,
  size = 36,
  ring = false,
  avatarUrl,
}: {
  name?: string
  seed?: string
  size?: number
  ring?: boolean
  avatarUrl?: string | null
}) {
  const [imgError, setImgError] = useState(false)
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const bg = avatarColor(seed || name || '?')
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size,
    flexShrink: 0,
    boxShadow: ring ? '0 0 0 2px var(--bc-bg)' : 'none',
  }
  if (avatarUrl && !imgError) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={{ ...baseStyle, objectFit: 'cover' }}
        onError={() => setImgError(true)}
        unoptimized
      />
    )
  }
  return (
    <div
      style={{
        ...baseStyle,
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
        fontWeight: 600,
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  )
}

export function BCAvatarStack({
  members,
  size = 28,
  max = 4,
}: {
  members: { id: string; displayName: string }[]
  size?: number
  max?: number
}) {
  const show = members.slice(0, max)
  const extra = members.length - show.length
  return (
    <div className="flex">
      {show.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <BCAvatar name={m.displayName} seed={m.id} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            borderRadius: size,
            background: 'var(--bc-chip)',
            color: 'var(--bc-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
            fontWeight: 600,
            fontSize: size * 0.38,
            boxShadow: '0 0 0 2px var(--bc-bg)',
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

// ── Group glyph ───────────────────────────────────────────────────
export function BCGroupGlyph({ name, size = 44 }: { name: string; size?: number }) {
  const ch = (name || '?').trim().charAt(0).toUpperCase()
  const tint = avatarColor(name)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: tint,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-newsreader), serif',
        fontSize: size * 0.55,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {ch}
    </div>
  )
}

// ── Category badge ────────────────────────────────────────────────
export function BCCategoryBadge({ category, size = 40 }: { category: string; size?: number }) {
  const c = BC_CATEGORIES[category] || BC_CATEGORIES.other
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: c.tint,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-newsreader), serif',
        fontWeight: 400,
        fontSize: size * 0.5,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {c.glyph}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────
export function BCCard({
  children,
  padded = true,
  style,
  onClick,
  className,
}: {
  children: React.ReactNode
  padded?: boolean
  style?: React.CSSProperties
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-(--bc-surface) rounded-[22px] border border-(--bc-softhair)',
        padded ? 'p-[18px]' : 'p-0',
        onClick && 'bc-tap cursor-pointer',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────
export function BCSectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.14em] font-medium" style={style}>
      {children}
    </div>
  )
}

// ── Top bar ───────────────────────────────────────────────────────
export function BCTopBar({
  left,
  right,
  title,
  subtitle,
}: {
  left?: React.ReactNode
  right?: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 min-h-13">
      <div className="min-w-10 flex items-center">{left}</div>
      <div className="text-center flex-1">
        {title && <div className="font-sans font-medium text-[15px] text-(--bc-ink) tracking-[-0.005em]">{title}</div>}
        {subtitle && <div className="font-sans text-[11px] text-(--bc-muted) mt-0.5 tracking-[0.04em]">{subtitle}</div>}
      </div>
      <div className="min-w-10 flex justify-end gap-1">{right}</div>
    </div>
  )
}

// ── Icon button ───────────────────────────────────────────────────
export function BCIconBtn({ name, onClick, href, badge }: { name: string; onClick?: () => void; href?: string; badge?: number }) {
  const inner = (
    <>
      <BCIcon name={name} size={20} color="var(--bc-ink)" />
      {badge != null && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-(--bc-accent) text-white rounded-full font-sans text-[9px] font-bold flex items-center justify-center shadow-[0_0_0_2px_var(--bc-bg)]">
          {badge}
        </span>
      )}
    </>
  )

  const baseClass =
    'bc-tap w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center text-(--bc-ink) relative'

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {inner}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {inner}
    </button>
  )
}

// ── Primary / ghost / quiet button ───────────────────────────────
export function BCButton({
  children,
  onClick,
  variant = 'primary',
  full,
  disabled,
  icon,
  type = 'button',
  href,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'accent' | 'ghost' | 'quiet' | 'danger'
  full?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  type?: 'button' | 'submit'
  href?: string
}) {
  const variantClass: Record<string, string> = {
    primary: 'bg-(--bc-ink) text-(--bc-bg) border-0',
    accent: 'bg-(--bc-accent) text-white border-0',
    ghost: 'bg-transparent text-(--bc-ink) border border-(--bc-hair)',
    quiet: 'bg-(--bc-chip) text-(--bc-ink) border-0',
    danger: 'bg-transparent text-(--bc-neg) border border-(--bc-softhair)',
  }

  const cls = cn(
    'bc-tap px-5.5 py-[15px] rounded-full font-sans font-medium text-base tracking-[-0.005em] inline-flex items-center justify-center gap-2.5 no-underline',
    variantClass[variant],
    full && 'w-full',
    disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
  )

  if (href) {
    return (
      <a href={href} className={cls}>
        {icon}
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {icon}
      {children}
    </button>
  )
}

// ── Numpad ────────────────────────────────────────────────────────
export function BCNumPad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
  return (
    <div className="grid grid-cols-3 gap-1 px-3 pb-[10px]">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className="bc-tap h-[52px] border-0 bg-transparent active:bg-(--bc-chip) font-serif text-[30px] font-normal text-(--bc-ink) rounded-[16px] cursor-pointer tabular-nums flex items-center justify-center"
        >
          {k === 'del' ? <BCIcon name="back" size={20} color="var(--bc-ink)" strokeWidth={1.6} /> : k}
        </button>
      ))}
    </div>
  )
}

// ── Amount display ────────────────────────────────────────────────
export function BCAmountDisplay({ value, currency, size = 88 }: { value: string; currency: string; size?: number }) {
  const display = formatCurrency(value || '0', currency)
  const displaySize = size * 0.78
  return (
    <div className="flex items-baseline justify-center">
      <span
        style={{
          fontFamily: 'var(--font-newsreader), serif',
          fontSize: displaySize,
          color: 'var(--bc-ink)',
          lineHeight: 0.95,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {display}
      </span>
    </div>
  )
}

export function BCTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { k: string; label: string }[]
  active: string
  onChange: (k: string) => void
}) {
  return (
    <Tabs value={active} onValueChange={onChange} className="mx-4">
      <TabsList className="w-full bg-(--bc-chip) rounded-[18px] h-16! p-1 gap-1">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.k}
            value={t.k}
            className="bc-tap flex-1 rounded-[14px] font-sans font-medium text-[13px] tracking-[-0.005em] text-(--bc-ink) data-active:bg-(--bc-surface) data-active:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-active:text-(--bc-ink)"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

// ── Chip / tag button ─────────────────────────────────────────────
export function BCChip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bc-tap border-0 cursor-pointer px-3.5 py-2 rounded-full text-[13px] font-sans font-medium tracking-[-0.005em] shrink-0',
        active ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
      )}
    >
      {children}
    </button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────
export function BCSpinner({ color = 'var(--bc-accent)' }: { color?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="animate-bc-spin">
      <circle cx="20" cy="20" r="16" stroke={color} strokeOpacity="0.18" strokeWidth="3" fill="none" />
      <path d="M20 4 A 16 16 0 0 1 36 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ── Balance badge helper ──────────────────────────────────────────
export function BCConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function BCBalanceBadge({ amount, currency, size = 26 }: { amount: number; currency: string; size?: number }) {
  const tCommon = useTranslations('common')
  const tHome = useTranslations('home')
  const isOwed = amount > 0.005
  const owes = amount < -0.005
  const settled = !isOwed && !owes
  return (
    <div className="text-right">
      {settled ? (
        <div className="font-sans text-xs text-(--bc-muted) tracking-[0.06em] uppercase">{tCommon('settled')}</div>
      ) : (
        <>
          <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.08em] uppercase whitespace-nowrap">
            {isOwed ? tHome('youre_owed') : tHome('you_owe_short')}
          </div>
          <div
            className={cn('font-serif leading-none tabular-nums tracking-[-0.01em] mt-0.5', isOwed ? 'text-(--bc-pos)' : 'text-(--bc-neg)')}
            style={{ fontSize: size }}
          >
            {currency}
            {Math.abs(amount).toFixed(2)}
          </div>
        </>
      )}
    </div>
  )
}
