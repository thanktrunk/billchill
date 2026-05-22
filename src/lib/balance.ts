export interface MemberBalance {
  memberId: string;
  displayName: string;
  balance: number; // positive = owed money, negative = owes money
}

export interface DebtTransaction {
  from: { memberId: string; displayName: string };
  to: { memberId: string; displayName: string };
  amount: number;
}

/**
 * Calculate net balance for each member in a group.
 * balance = (total paid by member) - (total owed by member via splits)
 */
export function calculateBalances(
  members: { id: string; displayName: string }[],
  expenses: { paidBy: string; splits: { memberId: string; shareAmount: string }[] }[],
  settlements: { fromMember: string; toMember: string; amount: string }[]
): MemberBalance[] {
  const balanceMap = new Map<string, number>();
  const nameMap = new Map<string, string>();

  // Initialize all members
  for (const member of members) {
    balanceMap.set(member.id, 0);
    nameMap.set(member.id, member.displayName);
  }

  // Process expenses
  for (const expense of expenses) {
    // Payer gets credit for total they paid (sum of all splits)
    for (const split of expense.splits) {
      const amount = parseFloat(split.shareAmount);
      // Payer is owed this amount
      balanceMap.set(
        expense.paidBy,
        (balanceMap.get(expense.paidBy) || 0) + amount
      );
      // Member owes this amount
      balanceMap.set(
        split.memberId,
        (balanceMap.get(split.memberId) || 0) - amount
      );
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const amount = parseFloat(settlement.amount);
    // fromMember paid, so their debt decreases (balance goes up)
    balanceMap.set(
      settlement.fromMember,
      (balanceMap.get(settlement.fromMember) || 0) + amount
    );
    // toMember received, so their credit decreases (balance goes down)
    balanceMap.set(
      settlement.toMember,
      (balanceMap.get(settlement.toMember) || 0) - amount
    );
  }

  return members.map((member) => ({
    memberId: member.id,
    displayName: member.displayName,
    balance: Math.round((balanceMap.get(member.id) || 0) * 100) / 100,
  }));
}

/**
 * Minimize the number of transactions needed to settle all debts.
 * Greedy algorithm: match largest creditor with largest debtor.
 */
export function minimizeDebts(balances: MemberBalance[]): DebtTransaction[] {
  const transactions: DebtTransaction[] = [];

  // Separate into debtors (negative balance = owes money) and creditors (positive balance = owed money)
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0.01) {
      transactions.push({
        from: { memberId: debtor.memberId, displayName: debtor.displayName },
        to: { memberId: creditor.memberId, displayName: creditor.displayName },
        amount: Math.round(transferAmount * 100) / 100,
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}
