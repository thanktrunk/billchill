import { calculateBalances, type MemberBalance } from '@/lib/balance'
import { formatDate } from '@/lib/currency'

type Member = { id: string; displayName: string }

type Split = {
  expenseId: string
  memberId: string
  shareAmount: string
}

type ExpenseWithId = {
  id: string
  paidBy: string
}

type Settlement = {
  fromMember: string
  toMember: string
  amount: string
}

type GroupRowBalance = {
  myBalance: number
}

type RelativeTimeTranslator = (key: string, values?: Record<string, string | number | Date>) => string

export class AppCalculations {
  static readonly BALANCE_EPSILON = 0.005

  static buildExpenseSplitsByExpenseId<T extends Split>(splits: T[]): Map<string, T[]> {
    const byExpenseId = new Map<string, T[]>()

    for (const split of splits) {
      const existing = byExpenseId.get(split.expenseId)
      if (existing) {
        existing.push(split)
      } else {
        byExpenseId.set(split.expenseId, [split])
      }
    }

    return byExpenseId
  }

  static buildExpensesWithSplits(expenses: ExpenseWithId[], splits: Split[]) {
    const splitsByExpenseId = this.buildExpenseSplitsByExpenseId(splits)

    return expenses.map((expense) => ({
      paidBy: expense.paidBy,
      splits: (splitsByExpenseId.get(expense.id) ?? []).map((split) => ({
        memberId: split.memberId,
        shareAmount: split.shareAmount,
      })),
    }))
  }

  static calculateGroupBalances(members: Member[], expenses: ExpenseWithId[], splits: Split[], settlements: Settlement[]): MemberBalance[] {
    const expensesWithSplits = this.buildExpensesWithSplits(expenses, splits)

    return calculateBalances(members, expensesWithSplits, settlements)
  }

  static getMyBalance(balances: MemberBalance[], myMemberId: string | null | undefined): number {
    if (!myMemberId) return 0
    return balances.find((balance) => balance.memberId === myMemberId)?.balance ?? 0
  }

  static summarizeMyBalances(rows: GroupRowBalance[]) {
    const totalOwed = rows.reduce((sum, row) => sum + Math.max(0, row.myBalance), 0)
    const totalOwe = rows.reduce((sum, row) => sum + Math.max(0, -row.myBalance), 0)

    return {
      totalOwed,
      totalOwe,
      netBalance: totalOwed - totalOwe,
    }
  }

  static getBalanceFlags(balance: number) {
    const isOwed = balance > this.BALANCE_EPSILON
    const isOwing = balance < -this.BALANCE_EPSILON

    return {
      isOwed,
      isOwing,
      isSettled: !isOwed && !isOwing,
    }
  }

  static sumAmountStrings(items: Array<{ amount: string }>): number {
    return items.reduce((sum, item) => sum + parseFloat(item.amount), 0)
  }

  static buildExpenseDelta(expenseAmount: string, myShareAmount: string | undefined, iPaid: boolean) {
    const amount = parseFloat(expenseAmount)
    const myShare = parseFloat(myShareAmount ?? '0')

    return {
      lent: iPaid ? amount - myShare : 0,
      owe: iPaid ? 0 : myShare,
    }
  }

  static relativeTime(iso: string, locale: string, tCommon: RelativeTimeTranslator, dateStyle: 'full' | 'short' = 'full'): string {
    const now = new Date()
    const date = new Date(iso)
    const diffSeconds = (now.getTime() - date.getTime()) / 1000

    if (diffSeconds < 60) return tCommon('now')
    if (diffSeconds < 3600) return tCommon('minutes_short', { '0': Math.floor(diffSeconds / 60) })
    if (diffSeconds < 86400) return tCommon('hours_short', { '0': Math.floor(diffSeconds / 3600) })
    if (diffSeconds < 86400 * 7) return tCommon('days_short', { '0': Math.floor(diffSeconds / 86400) })

    if (dateStyle === 'short') {
      return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    }

    return formatDate(iso, locale)
  }
}
