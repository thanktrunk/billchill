import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { db } from '@/db'
import { groups, groupMembers, expenses, expenseSplits, settlements } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { hasLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { calculateBalances } from '@/lib/balance'
import { BCIcon, BCGroupGlyph, BCAvatarStack, BCCard, BCSectionLabel } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

function currencySymbol(code: string) {
  return ({ USD: '$', EUR: '€', GBP: '£', JPY: '¥' } as Record<string, string>)[code] ?? code
}

function relativeTime(
  iso: string,
  locale: string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const now = new Date()
  const t = new Date(iso)
  const diff = (now.getTime() - t.getTime()) / 1000
  if (diff < 60) return tCommon('now')
  if (diff < 3600) return tCommon('minutes_short', { '0': Math.floor(diff / 60) })
  if (diff < 86400) return tCommon('hours_short', { '0': Math.floor(diff / 3600) })
  if (diff < 86400 * 7) return tCommon('days_short', { '0': Math.floor(diff / 86400) })
  return t.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default async function GroupsPage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [user, tCommon, tHome] = await Promise.all([
    requireUser(),
    getTranslations({ locale: lang, namespace: 'common' }),
    getTranslations({ locale: lang, namespace: 'home' }),
  ])

  // Get user's memberships
  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, myMemberId: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id))

  const groupIds = myMemberships.map((m) => m.groupId)
  const membershipMap = new Map(myMemberships.map((m) => [m.groupId, m.myMemberId]))

  let groupRows: GroupRow[] = []

  if (groupIds.length > 0) {
    const [allGroups, allMembers, allExpenses, allSettlements] = await Promise.all([
      db.select().from(groups).where(inArray(groups.id, groupIds)),
      db
        .select()
        .from(groupMembers)
        .where(and(inArray(groupMembers.groupId, groupIds), eq(groupMembers.isActive, true))),
      db.select().from(expenses).where(inArray(expenses.groupId, groupIds)),
      db.select().from(settlements).where(inArray(settlements.groupId, groupIds)),
    ])

    const expenseIds = allExpenses.map((e) => e.id)
    const allSplits = expenseIds.length > 0 ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : []

    groupRows = allGroups
      .filter((g) => !g.archivedAt)
      .map((g) => {
        const members = allMembers.filter((m) => m.groupId === g.id)
        const gExpenses = allExpenses.filter((e) => e.groupId === g.id)
        const gSettlements = allSettlements.filter((s) => s.groupId === g.id)

        const myMemberId = membershipMap.get(g.id)
        const expensesWithSplits = gExpenses.map((e) => ({
          paidBy: e.paidBy,
          splits: allSplits.filter((s) => s.expenseId === e.id).map((s) => ({ memberId: s.memberId, shareAmount: s.shareAmount })),
        }))

        const balances = calculateBalances(
          members.map((m) => ({ id: m.id, displayName: m.displayName })),
          expensesWithSplits,
          gSettlements.map((s) => ({
            fromMember: s.fromMember,
            toMember: s.toMember,
            amount: s.amount,
          })),
        )

        const myBal = myMemberId ? (balances.find((b) => b.memberId === myMemberId)?.balance ?? 0) : 0

        const lastExpense = gExpenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

        return {
          group: g,
          members,
          myBalance: myBal,
          lastActivity: lastExpense?.createdAt?.toISOString(),
          expenseCount: gExpenses.length,
        }
      })
      .sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''))
  }

  const totalOwed = groupRows.reduce((s, r) => s + Math.max(0, r.myBalance), 0)
  const totalOwe = groupRows.reduce((s, r) => s + Math.max(0, -r.myBalance), 0)
  const netBalance = totalOwed - totalOwe
  const heroCurrency = currencySymbol(groupRows[0]?.group?.currency ?? 'USD')

  return (
    <div className="bc-page">
      <div className="flex items-center justify-between px-4 pt-4 pb-1 min-h-13">
        <div className="bc-wordmark pl-1.5">{tCommon('app_name')}</div>
        <Link href={`/${lang}/groups/new`} className="bc-tap w-10 h-10 rounded-full flex items-center justify-center text-(--bc-ink)">
          <BCIcon name="users" size={20} color="var(--bc-ink)" />
        </Link>
      </div>

      <div className="px-4 pt-2">
        <div className="bg-(--bc-ink) text-(--bc-bg) rounded-[28px] px-5.5 py-5 relative overflow-hidden">
          <div className="font-sans text-[11px] text-[rgba(245,241,234,0.55)] uppercase tracking-[0.14em] mb-1.5">
            {tHome('your_balance')}
          </div>
          <div>
            <div
              className={cn(
                'font-serif text-[60px] leading-[0.95] tabular-nums tracking-[-0.02em]',
                netBalance >= 0 ? 'text-[#E8DCC8]' : 'text-[#F2A788]',
              )}
            >
              <span className="text-[32px] opacity-60 mr-1">{heroCurrency}</span>
              {Math.abs(netBalance).toFixed(2).split('.')[0]}
              <span className="text-[32px] opacity-[0.55]">.{Math.abs(netBalance).toFixed(2).split('.')[1]}</span>
            </div>
          </div>
          <div className="flex gap-3.5 mt-[18px]">
            <div className="flex-1">
              <div className="font-sans text-[11px] opacity-50 tracking-[0.08em] uppercase">{tHome('owed_to_you')}</div>
              <div className="font-mono text-base font-medium mt-1 text-[#9CC8A8] tabular-nums">
                {heroCurrency}
                {totalOwed.toFixed(2)}
              </div>
            </div>
            <div className="w-px bg-[rgba(245,241,234,0.16)]" />
            <div className="flex-1">
              <div className="font-sans text-[11px] opacity-50 tracking-[0.08em] uppercase">{tHome('you_owe')}</div>
              <div className="font-mono text-base font-medium mt-1 text-[#F2A788] tabular-nums">
                {heroCurrency}
                {totalOwe.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5.5 pt-[22px] pb-[10px]">
        <BCSectionLabel>{tHome('groups_section')}</BCSectionLabel>
        <div className="font-sans text-xs text-(--bc-muted)">{tHome('active', { 0: groupRows.length })}</div>
      </div>

      <div className="flex-1 px-4 pb-40 flex flex-col gap-2.5">
        {groupRows.length === 0 ? (
          <div className="py-10 px-5 text-center text-(--bc-muted) font-sans">{tHome('empty')}</div>
        ) : (
          groupRows.map((r) => (
            <GroupRowCard
              key={r.group.id}
              row={r}
              lang={lang}
              settled={tCommon('settled')}
              youreOwed={tHome('youre_owed')}
              youOweShort={tHome('you_owe_short')}
              lastActivityStr={r.lastActivity ? relativeTime(r.lastActivity, lang, tCommon) : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}

type GroupRow = {
  group: {
    id: string
    name: string
    currency: string
    archivedAt: Date | null
  }
  members: { id: string; displayName: string }[]
  myBalance: number
  lastActivity?: string
  expenseCount: number
}

function GroupRowCard({
  row,
  lang,
  settled,
  youreOwed,
  youOweShort,
  lastActivityStr,
}: {
  row: GroupRow
  lang: string
  settled: string
  youreOwed: string
  youOweShort: string
  lastActivityStr?: string
}) {
  const { group, members, myBalance } = row
  const sym = currencySymbol(group.currency)
  const isOwed = myBalance > 0.005
  const owes = myBalance < -0.005
  const isSettled = !isOwed && !owes

  return (
    <Link href={`/${lang}/groups/${group.id}`} className="no-underline">
      <BCCard padded={false} className="bc-tap px-4 py-3.5">
        <div className="flex items-center gap-3.5">
          <BCGroupGlyph name={group.name} size={44} />
          <div className="flex-1 min-w-0">
            <div className="font-sans font-medium text-base text-(--bc-ink) tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
              {group.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <BCAvatarStack members={members} size={20} max={4} />
              {lastActivityStr && <div className="font-sans text-xs text-(--bc-muted)">· {lastActivityStr}</div>}
            </div>
          </div>
          <div className="text-right">
            {isSettled ? (
              <div className="font-sans text-xs text-(--bc-muted) tracking-[0.06em] uppercase">{settled}</div>
            ) : (
              <>
                <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.08em] uppercase whitespace-nowrap">
                  {isOwed ? youreOwed : youOweShort}
                </div>
                <div
                  className={cn(
                    'font-serif text-[26px] leading-none tabular-nums tracking-[-0.01em] mt-0.5',
                    isOwed ? 'text-(--bc-pos)' : 'text-(--bc-neg)',
                  )}
                >
                  {sym}
                  {Math.abs(myBalance).toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>
      </BCCard>
    </Link>
  )
}
