"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  BCIcon, BCCard, BCSectionLabel, BCAvatar,
  BCCategoryBadge, BCTabs,
} from "@/components/bc-ui";
import { currencySymbol } from "@/lib/utils";

function shortDate(iso: string, lang: string) {
  const t = new Date(iso);
  return t.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

type Member = { id: string; displayName: string; userId: string | null };
type Expense = {
  id: string; description: string; amount: string; currency: string;
  category: string | null; date: string; paidBy: string; createdAt: string;
};
type Split = { expenseId: string; memberId: string; shareAmount: string };
type Settlement = {
  id: string; fromMember: string; toMember: string;
  amount: string; settledAt: string;
};
type Balance = { memberId: string; displayName: string; balance: number };
type Debt = {
  from: { memberId: string; displayName: string };
  to: { memberId: string; displayName: string };
  amount: number;
};

export function GroupDetailClient({
  group,
  members,
  expenses,
  splits,
  settlements,
  balances,
  minimizedDebts,
  myMemberId,
  myBalance,
}: {
  group: { id: string; name: string; currency: string };
  members: Member[];
  expenses: Expense[];
  splits: Split[];
  settlements: Settlement[];
  balances: Balance[];
  minimizedDebts: Debt[];
  myMemberId: string | null;
  myBalance: number;
}) {
  const locale = useLocale();
  const tGroup = useTranslations("group");
  const tCommon = useTranslations("common");

  const [tab, setTab] = useState<"expenses" | "balances">("expenses");
  const sym = currencySymbol(group.currency);

  const expensesSorted = [...expenses].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const settlementsSorted = [...settlements].sort((a, b) =>
    b.settledAt.localeCompare(a.settledAt)
  );

  // Merge expenses + settlements into timeline
  const items: Array<{ kind: "expense"; e: Expense } | { kind: "settlement"; s: Settlement }> = [
    ...expensesSorted.map((e) => ({ kind: "expense" as const, e })),
    ...settlementsSorted.map((s) => ({ kind: "settlement" as const, s })),
  ].sort((a, b) => {
    const ta = a.kind === "expense" ? a.e.createdAt : a.s.settledAt;
    const tb = b.kind === "expense" ? b.e.createdAt : b.s.settledAt;
    return tb.localeCompare(ta);
  });

  // Group by day
  const dayGroups: { day: string; items: typeof items }[] = [];
  items.forEach((it) => {
    const day = (it.kind === "expense" ? it.e.createdAt : it.s.settledAt).slice(0, 10);
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else dayGroups.push({ day, items: [it] });
  });

  const isOwed = myBalance > 0.005;
  const isOwing = myBalance < -0.005;

  const splitsByExpense = new Map<string, Split[]>();
  for (const s of splits) {
    const arr = splitsByExpense.get(s.expenseId) ?? [];
    arr.push(s);
    splitsByExpense.set(s.expenseId, arr);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bc-bg)",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 4px",
          minHeight: 52,
        }}
      >
        <Link
          href={`/${locale}/groups`}
          className="bc-tap"
          style={{
            width: 40, height: 40, borderRadius: 999, border: "none",
            background: "transparent", display: "flex", alignItems: "center",
            justifyContent: "center", textDecoration: "none",
          }}
        >
          <BCIcon name="back" size={20} color="var(--bc-ink)" />
        </Link>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500, fontSize: 15, color: "var(--bc-ink)",
              letterSpacing: "-0.005em",
            }}
          >
            {group.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 11, color: "var(--bc-muted)", marginTop: 2, letterSpacing: "0.04em",
            }}
          >
            {tGroup(members.length === 1 ? "members_count_one" : "members_count_other", { 0: members.length })} · {group.currency}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>


      <div style={{ padding: "6px 16px 0" }}>
        <BCCard
          padded={false}
          style={{ padding: "16px 18px", background: "var(--bc-ink)", border: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 11, opacity: 0.55, textTransform: "uppercase",
                  letterSpacing: "0.14em", color: "var(--bc-bg)",
                }}
              >
                {isOwed ? tGroup("youre_owed") : isOwing ? tGroup("you_owe") : tGroup("all_settled")}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.02em",
                  color: Math.abs(myBalance) < 0.005 ? "var(--bc-bg)" : isOwed ? "#9CC8A8" : "#F2A788",
                  marginTop: 6,
                }}
              >
                {sym}{Math.abs(myBalance).toFixed(2)}
              </div>
            </div>
            <Link
              href={`/${locale}/groups/${group.id}/settle`}
              className="bc-tap"
              style={{
                background: "rgba(245,241,234,0.12)",
                color: "var(--bc-bg)",
                border: "none",
                padding: "12px 18px", borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500, fontSize: 13, letterSpacing: "-0.005em",
                display: "inline-flex", alignItems: "center", gap: 6,
                textDecoration: "none",
              }}
            >
              <BCIcon name="swap" size={14} color="var(--bc-bg)" strokeWidth={1.8} />
              {tGroup("settle_up")}
            </Link>
          </div>
        </BCCard>
      </div>


      <div style={{ padding: "14px 0 8px" }}>
        <BCTabs
          active={tab}
          onChange={(k) => setTab(k as "expenses" | "balances")}
          tabs={[
            {
              k: "expenses",
              label: tGroup("tab_expenses", { 0: expenses.length }),
            },
            { k: "balances", label: tGroup("tab_balances") },
          ]}
        />
      </div>


      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 16px 160px",
        }}
      >
        {tab === "expenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {dayGroups.map((grp) => (
              <div key={grp.day}>
                <div
                  style={{
                    padding: "0 4px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <BCSectionLabel>{shortDate(grp.day, locale)}</BCSectionLabel>
                  <div
                    style={{ flex: 1, height: 1, background: "var(--bc-softhair)" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grp.items.map((it) =>
                    it.kind === "expense" ? (
                      <ExpenseRow
                        key={it.e.id}
                        expense={it.e}
                        splits={splitsByExpense.get(it.e.id) ?? []}
                        members={members}
                        myMemberId={myMemberId}
                        sym={sym}
                        tGroup={tGroup}
                      />
                    ) : (
                      <SettlementRow
                        key={it.s.id}
                        settlement={it.s}
                        members={members}
                        sym={sym}
                        locale={locale}
                        tGroup={tGroup}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--bc-muted)",
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                }}
              >
                {tGroup("no_expenses")}
              </div>
            )}
          </div>
        )}

        {tab === "balances" && (
          <BalancesView
            members={members}
            balances={balances}
            minimizedDebts={minimizedDebts}
            myMemberId={myMemberId}
            sym={sym}
            locale={locale}
            tGroup={tGroup}
            tCommon={tCommon}
            groupId={group.id}
          />
        )}
      </div>


      {tab === "expenses" && (
        <div style={{ position: "fixed", bottom: 100, right: 18, zIndex: 25 }}>
          <Link
            href={`/${locale}/groups/${group.id}/expenses/new`}
            className="bc-tap"
            style={{
              background: "var(--bc-accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              padding: "14px 22px 14px 18px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500,
              fontSize: 15,
              letterSpacing: "-0.005em",
              boxShadow: "0 14px 30px rgba(229,87,47,0.35), 0 4px 10px rgba(0,0,0,0.12)",
              textDecoration: "none",
            }}
          >
            <BCIcon name="plus" size={20} color="#fff" strokeWidth={2.2} />
            {tGroup("add_expense")}
          </Link>
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  splits,
  members,
  myMemberId,
  sym,
  tGroup,
}: {
  expense: Expense;
  splits: Split[];
  members: Member[];
  myMemberId: string | null;
  sym: string;
  tGroup: ReturnType<typeof useTranslations>;
}) {
  const payer = members.find((m) => m.id === expense.paidBy);
  const payerName = payer?.displayName ?? "?";
  const mySplit = splits.find((s) => s.memberId === myMemberId);
  const iPaid = expense.paidBy === myMemberId;
  const amount = parseFloat(expense.amount);
  const myShare = parseFloat(mySplit?.shareAmount ?? "0");
  const lent = iPaid ? amount - myShare : 0;
  const owe = !iPaid ? myShare : 0;

  return (
    <BCCard padded={false} style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <BCCategoryBadge category={expense.category ?? "other"} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500, fontSize: 14.5, color: "var(--bc-ink)",
              letterSpacing: "-0.005em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {expense.description}
          </div>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 12, color: "var(--bc-muted)", marginTop: 2,
            }}
          >
            {tGroup(splits.length === 1 ? "paid_shares_one" : "paid_shares_other", { 0: payerName, 1: splits.length })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 22, lineHeight: 1, color: "var(--bc-ink)",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
            }}
          >
            {sym}{amount.toFixed(2)}
          </div>
          {(lent > 0.005 || owe > 0.005) && (
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11, marginTop: 3,
                color: iPaid ? "var(--bc-pos)" : "var(--bc-neg)",
                letterSpacing: "0.02em",
              }}
            >
              {iPaid ? `+${sym}${lent.toFixed(2)}` : `−${sym}${owe.toFixed(2)}`}
            </div>
          )}
        </div>
      </div>
    </BCCard>
  );
}

function SettlementRow({
  settlement,
  members,
  sym,
  locale,
  tGroup,
}: {
  settlement: Settlement;
  members: Member[];
  sym: string;
  locale: string;
  tGroup: ReturnType<typeof useTranslations>;
}) {
  const from = members.find((m) => m.id === settlement.fromMember);
  const to   = members.find((m) => m.id === settlement.toMember);
  return (
    <BCCard
      padded={false}
      style={{ padding: "12px 14px", background: "var(--bc-chip)", border: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 999,
            background: "var(--bc-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px dashed var(--bc-hair)",
          }}
        >
          <BCIcon name="check" size={18} color="var(--bc-ink)" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500, fontSize: 14.5, color: "var(--bc-ink)",
            }}
          >
            {tGroup("paid_to", { 0: from?.displayName ?? "?", 1: to?.displayName ?? "?" })}
          </div>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 12, color: "var(--bc-muted)", marginTop: 2,
            }}
          >
            {tGroup("settlement_date", { 0: shortDate(settlement.settledAt, locale) })}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 22, lineHeight: 1, color: "var(--bc-ink)",
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
          }}
        >
          {sym}{parseFloat(settlement.amount).toFixed(2)}
        </div>
      </div>
    </BCCard>
  );
}

function BalancesView({
  members, balances, minimizedDebts, myMemberId, sym, locale, tGroup, tCommon, groupId,
}: {
  members: Member[];
  balances: Balance[];
  minimizedDebts: Debt[];
  myMemberId: string | null;
  sym: string;
  locale: string;
  tGroup: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  groupId: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <div>
        <div style={{ padding: "0 4px 8px" }}>
          <BCSectionLabel>{tGroup("member_balances")}</BCSectionLabel>
        </div>
        <BCCard padded={false}>
          {members.map((m, i) => {
            const bal = balances.find((b) => b.memberId === m.id)?.balance ?? 0;
            const isMe = m.id === myMemberId;
            return (
              <div
                key={m.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--bc-softhair)",
                }}
              >
                <BCAvatar name={m.displayName} seed={m.id} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontWeight: 500, fontSize: 14.5, color: "var(--bc-ink)",
                    }}
                  >
                    {m.displayName}
                    {isMe && (
                      <span
                        style={{
                          fontSize: 10, marginLeft: 8, padding: "2px 7px",
                          borderRadius: 999, background: "var(--bc-chip)",
                          color: "var(--bc-muted)", letterSpacing: "0.08em",
                        }}
                      >
                        {tGroup("you_label")}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontSize: 11, color: "var(--bc-muted)", marginTop: 2,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}
                  >
                    {Math.abs(bal) < 0.005
                      ? tCommon("settled")
                      : bal > 0
                        ? tGroup("is_owed")
                        : tGroup("owes")}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-newsreader), serif",
                    fontSize: 22, lineHeight: 1,
                    color: Math.abs(bal) < 0.005
                      ? "var(--bc-muted)"
                      : bal > 0 ? "var(--bc-pos)" : "var(--bc-neg)",
                    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
                  }}
                >
                  {Math.abs(bal) < 0.005 ? "·" : `${sym}${Math.abs(bal).toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </BCCard>
      </div>


      {minimizedDebts.length > 0 && (
        <div>
          <div
            style={{
              padding: "0 4px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <BCSectionLabel>
              {tGroup("simplified_payments")}
            </BCSectionLabel>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 11, color: "var(--bc-muted)", letterSpacing: "0.04em",
              }}
            >
              {tGroup(minimizedDebts.length === 1 ? "transfers_one" : "transfers_other", { 0: minimizedDebts.length })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {minimizedDebts.map((debt, i) => {
              const involvesMe =
                debt.from.memberId === myMemberId ||
                debt.to.memberId === myMemberId;
              return (
                <BCCard
                  key={i}
                  padded={false}
                  style={{
                    padding: "12px 14px",
                    background: involvesMe ? "var(--bc-surface)" : "var(--bc-chip)",
                    border: involvesMe ? "1px solid var(--bc-softhair)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BCAvatar name={debt.from.displayName} seed={debt.from.memberId} size={32} />
                    <BCIcon name="arrowR" size={16} color="var(--bc-muted)" strokeWidth={1.6} />
                    <BCAvatar name={debt.to.displayName} seed={debt.to.memberId} size={32} />
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                          fontWeight: 500, fontSize: 14, color: "var(--bc-ink)",
                          letterSpacing: "-0.005em",
                        }}
                      >
                        {tGroup("pays", { 0: debt.from.displayName, 1: debt.to.displayName })}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-newsreader), serif",
                        fontSize: 22, lineHeight: 1, color: "var(--bc-ink)",
                        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
                      }}
                    >
                      {sym}{debt.amount.toFixed(2)}
                    </div>
                  </div>
                </BCCard>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link
              href={`/${locale}/groups/${groupId}/settle`}
              className="bc-tap"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "15px 22px", borderRadius: 999,
                background: "var(--bc-chip)", color: "var(--bc-ink)",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500, fontSize: 16, letterSpacing: "-0.005em",
                textDecoration: "none",
              }}
            >
              <BCIcon name="swap" size={16} color="var(--bc-ink)" strokeWidth={1.8} />
              {tGroup("record_settlement")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
