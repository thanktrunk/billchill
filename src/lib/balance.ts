export interface MemberBalance {
  memberId: string
  displayName: string
  balance: number // positive = owed money, negative = owes money
}

export interface DebtTransaction {
  from: { memberId: string; displayName: string }
  to: { memberId: string; displayName: string }
  amount: number
}

// balance = (total paid by member) - (total owed by member via splits)
export function calculateBalances(
  members: { id: string; displayName: string }[],
  expenses: {
    paidBy: string
    splits: { memberId: string; shareAmount: string }[]
  }[],
  settlements: { fromMember: string; toMember: string; amount: string }[],
): MemberBalance[] {
  const balanceMap = new Map<string, number>()
  const nameMap = new Map<string, string>()

  for (const member of members) {
    balanceMap.set(member.id, 0)
    nameMap.set(member.id, member.displayName)
  }

  for (const expense of expenses) {
    for (const split of expense.splits) {
      const amount = parseFloat(split.shareAmount)
      balanceMap.set(expense.paidBy, (balanceMap.get(expense.paidBy) || 0) + amount)
      balanceMap.set(split.memberId, (balanceMap.get(split.memberId) || 0) - amount)
    }
  }

  for (const settlement of settlements) {
    const amount = parseFloat(settlement.amount)
    balanceMap.set(settlement.fromMember, (balanceMap.get(settlement.fromMember) || 0) + amount)
    balanceMap.set(settlement.toMember, (balanceMap.get(settlement.toMember) || 0) - amount)
  }

  return members.map((member) => ({
    memberId: member.id,
    displayName: member.displayName,
    balance: Math.round((balanceMap.get(member.id) || 0) * 100) / 100,
  }))
}

// Greedy: match largest creditor with largest debtor to minimize transaction count.
export function minimizeDebts(balances: MemberBalance[]): DebtTransaction[] {
  const transactions: DebtTransaction[] = []

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount)

  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount)

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const transferAmount = Math.min(debtor.amount, creditor.amount)

    if (transferAmount > 0.01) {
      transactions.push({
        from: { memberId: debtor.memberId, displayName: debtor.displayName },
        to: { memberId: creditor.memberId, displayName: creditor.displayName },
        amount: Math.round(transferAmount * 100) / 100,
      })
    }

    debtor.amount -= transferAmount
    creditor.amount -= transferAmount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return transactions
}
