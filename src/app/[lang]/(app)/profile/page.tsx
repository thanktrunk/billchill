import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { hasLocale } from '@/lib/i18n'
import { BCIcon, BCCard, BCSectionLabel } from '@/components/bc-ui'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ProfileNameEditor } from './profile-name-editor'
import { ProfileCurrencyEditor } from './profile-currency-editor'
import { ArchivedGroupsRow } from './archived-groups-row'
import { cn, formatCurrency } from '@/lib/utils'
import { getProfileStatsData } from '@/db/queries/profile'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <BCCard padded={false} className="p-3.5">
      <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.1em] uppercase">{label}</div>
      <div className="font-serif text-[30px] text-(--bc-ink) leading-[1.1] tracking-[-0.015em] mt-1.5 tabular-nums">{value}</div>
    </BCCard>
  )
}

export default async function ProfilePage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [user, t, tCommon] = await Promise.all([
    requireUser(),
    getTranslations({ locale: lang, namespace: 'profile' }),
    getTranslations({ locale: lang, namespace: 'common' }),
  ])

  const { allExpenses, allGroups, memberIds } = await getProfileStatsData(user.id)

  const activeGroups = allGroups.filter((g) => !g.archivedAt)
  const archivedGroups = allGroups.filter((g) => g.archivedAt)
  const totalLent = allExpenses.filter((e) => memberIds.includes(e.paidBy)).reduce((s, e) => s + parseFloat(e.amount), 0)

  const providerLabels: Record<string, string> = {
    'google-oauth2': 'Google',
    github: 'GitHub',
    auth0: 'Email',
    facebook: 'Facebook',
    twitter: 'Twitter',
    apple: 'Apple',
  }
  const providerKey = user.auth0Id.split('|')[0] ?? ''
  const connectedProvider = providerLabels[providerKey] ?? providerKey

  const prefRows = [
    {
      label: t('language'),
      value: lang === 'vi' ? 'Tiếng Việt' : 'English',
      href: lang === 'vi' ? '/en/profile' : '/vi/profile',
    },
    { label: t('notifications'), value: t('all_on') },
    { label: t('appearance'), value: t('auto') },
    { label: t('connected_accounts'), value: connectedProvider },
  ]

  return (
    <div className="bc-page">
      <div className="px-4 pt-2 pb-1 min-h-[52px] flex items-center justify-between">
        <div className="font-serif text-[28px] text-(--bc-ink) pl-1.5 tracking-[-0.015em]">{t('title')}</div>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-[160px] flex flex-col gap-4.5">
        <BCCard>
          <ProfileNameEditor
            displayName={user.displayName}
            userId={user.id}
            email={user.email}
            avatarUrl={user.avatarUrl}
            labels={{ edit: t('edit_name'), save: t('save_name'), cancel: t('cancel_name') }}
          />
        </BCCard>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('stat_groups')} value={String(activeGroups.length)} />
            <Stat label={t('stat_expenses')} value={String(allExpenses.length)} />
          </div>
          <Stat label={t('stat_total_lent')} value={formatCurrency(totalLent, user.preferredCurrency)} />
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{t('preferences')}</BCSectionLabel>
          </div>
          <BCCard padded={false}>
            <div className="flex items-center justify-between px-4.5 py-3.5">
              <div className="font-sans text-[15px] text-(--bc-ink)">{t('language')}</div>
              <Link href={lang === 'vi' ? '/en/profile' : '/vi/profile'} className="flex items-center gap-2 no-underline">
                <div className="font-sans text-sm text-(--bc-muted)">{lang === 'vi' ? 'Tiếng Việt' : 'English'}</div>
                <BCIcon name="arrowR" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
              </Link>
            </div>
            <ProfileCurrencyEditor
              preferredCurrency={user.preferredCurrency}
              label={t('default_currency')}
              saveLabel={t('save_name')}
              cancelLabel={t('cancel_name')}
            />
            {prefRows.slice(1).map((r) => {
              const inner = (
                <div
                  className={cn(
                    'flex items-center justify-between px-4.5 py-3.5 border-t border-(--bc-softhair)',
                    r.href ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <div className="font-sans text-[15px] text-(--bc-ink)">{r.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-sans text-sm text-(--bc-muted)">{r.value}</div>
                    <BCIcon name="arrowR" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
                  </div>
                </div>
              )
              return r.href ? (
                <Link key={r.label} href={r.href} className="no-underline">
                  {inner}
                </Link>
              ) : (
                <div key={r.label}>{inner}</div>
              )
            })}
            {archivedGroups.length > 0 && (
              <ArchivedGroupsRow groups={archivedGroups} label={t('archived_groups')} archivedLabel={t('archived')} />
            )}
          </BCCard>
        </div>

        <div className="text-center p-3 font-sans text-[11px] text-(--bc-muted) tracking-[0.1em] uppercase">{tCommon('app_footer')}</div>

        <a
          href={`/auth/logout?returnTo=${process.env.APP_BASE_URL ?? ''}/${lang}`}
          className="bc-tap bg-transparent text-(--bc-neg) border border-(--bc-softhair) py-3.5 px-5.5 rounded-full cursor-pointer font-sans font-medium text-[15px] tracking-[-0.005em] flex items-center justify-center gap-2 no-underline"
        >
          <BCIcon name="back" size={16} color="var(--bc-neg)" strokeWidth={1.8} />
          {t('logout')}
        </a>
      </div>
    </div>
  )
}
