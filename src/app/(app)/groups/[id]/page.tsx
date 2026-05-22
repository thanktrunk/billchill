import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { groups, groupMembers, expenses, expenseSplits, settlements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { verifyGroupMembership } from "@/lib/access-control";
import { calculateBalances, minimizeDebts } from "@/lib/balance";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  await verifyGroupMembership(id, user.id);

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, id),
  });

  if (!group) notFound();

  const members = await db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, id),
  });

  const groupExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, id))
    .orderBy(expenses.date);

  // Get splits for all expenses
  const expenseIds = groupExpenses.map((e) => e.id);
  const allSplits = expenseIds.length
    ? await db.select().from(expenseSplits).where(
        eq(expenseSplits.expenseId, expenseIds[0]) // simplified - will enhance
      )
    : [];

  const groupSettlements = await db
    .select()
    .from(settlements)
    .where(eq(settlements.groupId, id));

  // Calculate balances
  const expensesWithSplits = groupExpenses.map((expense) => ({
    paidBy: expense.paidBy,
    splits: allSplits
      .filter((s) => s.expenseId === expense.id)
      .map((s) => ({ memberId: s.memberId, shareAmount: s.shareAmount })),
  }));

  const balances = calculateBalances(
    members.map((m) => ({ id: m.id, displayName: m.displayName })),
    expensesWithSplits,
    groupSettlements.map((s) => ({
      fromMember: s.fromMember,
      toMember: s.toMember,
      amount: s.amount,
    }))
  );

  const minimizedDebts = minimizeDebts(balances);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/groups" className="text-sm text-muted-foreground hover:underline">
            ← Back to groups
          </Link>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <span className="text-sm text-muted-foreground">{group.currency}</span>
        </div>
        <Link
          href={`/groups/${id}/expenses/new`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Expense
        </Link>
      </div>

      {/* Members */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Members</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm"
            >
              {member.displayName}
              {!member.isActive && " (inactive)"}
            </span>
          ))}
        </div>
      </section>

      {/* Balances */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Balances</h2>
        {minimizedDebts.length === 0 ? (
          <p className="text-muted-foreground">All settled up!</p>
        ) : (
          <div className="space-y-2">
            {minimizedDebts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <span>
                  <span className="font-medium">{debt.from.displayName}</span>
                  {" → "}
                  <span className="font-medium">{debt.to.displayName}</span>
                </span>
                <span className="font-semibold">
                  {group.currency} {debt.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Expenses */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Expenses</h2>
        {groupExpenses.length === 0 ? (
          <p className="text-muted-foreground">No expenses yet.</p>
        ) : (
          <div className="space-y-2">
            {groupExpenses.map((expense) => {
              const payer = members.find((m) => m.id === expense.paidBy);
              return (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {payer?.displayName} · {expense.date}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {expense.currency} {parseFloat(expense.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
