import { getCurrentUser } from '@/lib/auth'
import { BottomNav } from '@/components/bottom-nav'
import { notFound } from 'next/navigation'
import { BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { hasLocale } from '@/lib/i18n'
import { getTranslations } from 'next-intl/server'

export default async function AppLayout({ children, params }: LayoutProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const user = await getCurrentUser()

  if (!user) {
    return <LandingPage lang={lang} />
  }

  return (
    <div className="bg-(--bc-bg) min-h-dvh">
      <div className="relative min-h-dvh max-w-120 mx-auto bg-(--bc-bg) text-(--bc-ink)">
        <main className="pb-safe-nav">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}

// ── Landing page (shown when not signed in) ───────────────────────
async function LandingPage({ lang }: { lang: string }) {
  const L = await getTranslations({ locale: lang, namespace: 'landing' })
  const tagline = L('tagline').split('\n')

  const features = [
    {
      glyph: 'L',
      tint: '#1A1A1A',
      t: L('feature_ledger_t'),
      b: L('feature_ledger_b'),
    },
    {
      glyph: 'S',
      tint: '#3F6E55',
      t: L('feature_smart_t'),
      b: L('feature_smart_b'),
    },
    {
      glyph: '¤',
      tint: '#B7873A',
      t: L('feature_multi_t'),
      b: L('feature_multi_b'),
    },
  ]

  return (
    <div className="bc-page max-w-120 mx-auto pt-safe pb-safe">
      <div className="flex items-center justify-between px-5.5 pt-1">
        <div className="bc-wordmark">billchill</div>
        <div className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.14em]">{lang === 'vi' ? 'VN' : 'EN'}</div>
      </div>

      <div className="px-5.5 pt-6">
        <LedgerHero settleUpLabel={L('hero_settle_up')} heroMeta={L('hero_meta')} />
      </div>

      <div className="px-6.5 pt-7">
        <div className="font-serif text-[40px] leading-[1.02] text-(--bc-ink) tracking-tight">
          {tagline.map((line, i) => (
            <div key={i} className={cn('whitespace-nowrap', i === 1 ? 'italic text-(--bc-accent)' : 'text-(--bc-ink)')}>
              {line}
            </div>
          ))}
        </div>
        <div className="mt-3.5 font-sans text-[15px] text-(--bc-muted) tracking-[-0.005em] leading-[1.45] max-w-80">{L('subhead')}</div>
      </div>

      <div className="flex-1" />
      <div className="flex flex-col gap-3.5 px-6.5 pt-3">
        {features.map((f) => (
          <div key={f.t} className="flex items-center gap-3.5">
            <div
              className="w-9 h-9 rounded-xl shrink-0 text-white flex items-center justify-center font-serif text-[20px]"
              style={{ background: f.tint }}
            >
              {f.glyph}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-sans font-medium text-sm text-(--bc-ink) tracking-[-0.005em]">{f.t}</div>
              <div className="font-sans text-xs text-(--bc-muted) mt-0.5">{f.b}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 px-5.5 pt-6 pb-4">
        <a
          href={`/auth/login?returnTo=/${lang}/groups`}
          className="bg-(--bc-ink) text-(--bc-bg) border-0 px-5.5 py-4 rounded-full font-sans font-medium text-base tracking-[-0.005em] flex items-center justify-center gap-2.5 no-underline"
        >
          {L('cta_login')}
          <BCIcon name="arrowR" size={18} color="var(--bc-bg)" strokeWidth={2.2} />
        </a>
        <div className="mt-1 font-sans text-[11px] text-(--bc-muted) text-center leading-[1.4] tracking-[-0.005em]">{L('legal')}</div>
      </div>
    </div>
  )
}

function LedgerHero({ settleUpLabel, heroMeta }: { settleUpLabel: string; heroMeta: string }) {
  return (
    <div className="relative h-42">
      <div className="absolute left-5 top-4 w-55 h-33 bg-(--bc-surface) border border-(--bc-softhair) rounded-[16px] -rotate-6 p-3.5 box-border flex flex-col gap-2">
        <ReceiptLine w="60%" />
        <ReceiptLine w="42%" />
        <ReceiptLine w="50%" />
        <div className="flex-1" />
        <div className="font-serif text-[22px] text-[#3F6E55] tracking-[-0.01em] self-end">$84.30</div>
      </div>
      <div className="absolute right-3 top-1.5 w-57.5 h-34.5 bg-(--bc-surface) border border-(--bc-softhair) rounded-[16px] rotate-[4deg] p-3.5 box-border flex flex-col gap-2 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
        <ReceiptLine w="70%" />
        <ReceiptLine w="55%" />
        <div className="flex gap-1 mt-0.5">
          {['S', 'J', 'N'].map((initial, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full text-white flex items-center justify-center font-sans text-[9px] font-semibold"
              style={{ background: ['#E5572F', '#3F6E55', '#B7873A'][i] }}
            >
              {initial}
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="font-serif text-[28px] text-(--bc-ink) tracking-[-0.015em]">€88.50</div>
      </div>
      <div className="absolute left-1/2 bottom-0 w-50 h-27.5 -translate-x-1/2 rotate-[-1.5deg] bg-(--bc-accent) text-white rounded-[16px] p-3.5 box-border shadow-[0_14px_30px_rgba(229,87,47,0.25)] flex flex-col">
        <div className="font-sans text-[10px] text-[rgba(255,255,255,0.7)] uppercase tracking-[0.12em]">{settleUpLabel}</div>
        <div className="font-serif text-[36px] mt-1 tracking-[-0.02em]">$1,270.22</div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-[22px] h-[22px] rounded-full bg-[rgba(255,255,255,0.25)] flex items-center justify-center">
            <BCIcon name="check" size={12} color="#fff" strokeWidth={2.6} />
          </div>
          <div className="font-sans text-xs text-[rgba(255,255,255,0.85)] tracking-[-0.005em]">{heroMeta}</div>
        </div>
      </div>
    </div>
  )
}

function ReceiptLine({ w }: { w: string }) {
  return <div className="h-1.5 rounded-[6px] bg-(--bc-chip)" style={{ width: w }} />
}
