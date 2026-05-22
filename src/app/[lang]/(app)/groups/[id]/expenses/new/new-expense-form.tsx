"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BCIcon, BCCard, BCSectionLabel, BCAvatar, BCCategoryBadge,
  BCNumPad, BCAmountDisplay, BCChip, BC_CATEGORIES,
} from "@/components/bc-ui";
import { addExpense, getGroupMembers } from "./actions";

type Member = { id: string; displayName: string };

function currencySymbol(code: string) {
  return ({ USD: "$", EUR: "€", GBP: "£", JPY: "¥" } as Record<string, string>)[code] ?? code;
}

export function NewExpenseForm({
  lang,
  groupId,
  groupName,
  currency,
  dict,
}: {
  lang: string;
  groupId: string;
  groupName: string;
  currency: string;
  dict: Record<string, string>;
}) {
  const router = useRouter();
  const sym = currencySymbol(currency);
  const [pending, setPending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [step, setStep] = useState<"amount" | "details">("amount");

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [category, setCategory] = useState("food");
  const [splitWith, setSplitWith] = useState<string[] | null>(null);

  useEffect(() => {
    getGroupMembers(groupId).then((ms) => {
      setMembers(ms);
      setPaidBy(ms[0]?.id ?? null);
    });
  }, [groupId]);

  const onKey = (k: string) => {
    setAmountStr((s) => {
      if (k === "del") return s.slice(0, -1);
      if (k === ".") {
        return !s.includes(".") && s.length > 0 ? s + "." : s;
      }
      if (s.includes(".") && s.split(".")[1].length >= 2) return s;
      if (s === "0" && k !== ".") return k;
      return s + k;
    });
  };

  const amount = parseFloat(amountStr) || 0;
  const selected = splitWith ?? members.map((m) => m.id);
  const perPerson = amount / Math.max(1, selected.length);

  const toggleMember = (mid: string) => {
    const cur = splitWith ?? members.map((m) => m.id);
    const has = cur.includes(mid);
    const next = has ? cur.filter((x) => x !== mid) : [...cur, mid];
    setSplitWith(next.length ? next : cur);
  };

  async function handleSave() {
    if (pending || !paidBy || !amount) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("description", description || (dict.untitled ?? "Untitled expense"));
      formData.set("amount", amount.toFixed(2));
      formData.set("paidBy", paidBy);
      formData.set("date", new Date().toISOString().split("T")[0]);
      formData.set("category", category);
      const splitList = selected;
      formData.set("splitMembers", JSON.stringify(splitList));
      formData.set("perPerson", perPerson.toFixed(2));

      await addExpenseWithSplit(groupId, formData, splitList, perPerson);
      router.push(`/${lang}/groups/${groupId}`);
    } catch {
      setPending(false);
    }
  }

  // Amount step
  if (step === "amount") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
          background: "var(--bc-bg)",
          color: "var(--bc-ink)",
        }}
      >
        {/* Top bar */}
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
            href={`/${lang}/groups/${groupId}`}
            className="bc-tap"
            style={{
              width: 40, height: 40, borderRadius: 999, border: "none",
              background: "transparent", display: "flex", alignItems: "center",
              justifyContent: "center", textDecoration: "none",
            }}
          >
            <BCIcon name="close" size={20} color="var(--bc-ink)" />
          </Link>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500, fontSize: 15, color: "var(--bc-ink)",
              }}
            >
              {dict.title ?? "Add expense"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 11, color: "var(--bc-muted)", marginTop: 2,
              }}
            >
              {groupName}
            </div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Description input */}
        <div style={{ padding: "8px 22px 0" }}>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={dict.placeholder_what ?? "What's this for?"}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500,
              fontSize: 18,
              color: "var(--bc-ink)",
              letterSpacing: "-0.01em",
              padding: "6px 0",
              boxSizing: "border-box",
            }}
          />
          <div style={{ height: 1, background: "var(--bc-softhair)", marginTop: 2 }} />
        </div>

        {/* Amount display */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px 24px",
          }}
        >
          <BCSectionLabel>{dict.amount ?? "Amount"}</BCSectionLabel>
          <div style={{ marginTop: 16 }}>
            <BCAmountDisplay value={amountStr} currency={sym} size={88} />
          </div>
          {/* Quick-fill chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <BCChip key={n} onClick={() => setAmountStr(String(n))}>
                {sym}{n}
              </BCChip>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <BCNumPad onKey={onKey} />

        {/* Continue button */}
        <div style={{ padding: "4px 18px 18px" }}>
          <button
            type="button"
            disabled={!(amount > 0)}
            onClick={() => setStep("details")}
            className="bc-tap"
            style={{
              background: amount > 0 ? "var(--bc-accent)" : "var(--bc-chip)",
              color: amount > 0 ? "#fff" : "var(--bc-muted)",
              border: "none",
              padding: "15px 22px",
              borderRadius: 999,
              cursor: amount > 0 ? "pointer" : "not-allowed",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500,
              fontSize: 16,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: amount > 0 ? 1 : 0.5,
            }}
          >
            {dict.continue ?? "Continue"}
            <BCIcon name="arrowR" size={18} color={amount > 0 ? "#fff" : "var(--bc-muted)"} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  }

  // Details step
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bc-bg)",
        color: "var(--bc-ink)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 4px",
          minHeight: 52,
        }}
      >
        <button
          type="button"
          onClick={() => setStep("amount")}
          className="bc-tap"
          style={{
            width: 40, height: 40, borderRadius: 999, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <BCIcon name="back" size={20} color="var(--bc-ink)" />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500, fontSize: 15, color: "var(--bc-ink)",
            }}
          >
            {dict.title ?? "Add expense"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 11, color: "var(--bc-muted)", marginTop: 2,
            }}
          >
            {groupName}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Summary */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            padding: "4px 4px",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500, fontSize: 16, color: "var(--bc-ink)",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {description || (dict.untitled ?? "Untitled expense")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11, color: "var(--bc-muted)", marginTop: 2,
                letterSpacing: "0.04em",
              }}
            >
              {new Date().toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 36, lineHeight: 1, color: "var(--bc-ink)",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em",
            }}
          >
            {sym}{amount.toFixed(2)}
          </div>
        </div>

        {/* Paid by */}
        <div>
          <div style={{ padding: "0 4px 8px" }}>
            <BCSectionLabel>{dict.paid_by ?? "Paid by"}</BCSectionLabel>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 4px" }}>
            {members.map((m) => {
              const sel = m.id === paidBy;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className="bc-tap"
                  style={{
                    flexShrink: 0, border: "none", cursor: "pointer",
                    background: sel ? "var(--bc-ink)" : "var(--bc-chip)",
                    color: sel ? "var(--bc-bg)" : "var(--bc-ink)",
                    padding: "8px 14px 8px 8px", borderRadius: 999,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontWeight: 500, fontSize: 13,
                  }}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={24} />
                  {m.displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <div style={{ padding: "0 4px 8px" }}>
            <BCSectionLabel>{dict.category ?? "Category"}</BCSectionLabel>
          </div>
          <div
            style={{
              display: "flex", gap: 8, overflowX: "auto", padding: "0 4px 4px",
            }}
          >
            {Object.entries(BC_CATEGORIES).map(([k, c]) => {
              const sel = category === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategory(k)}
                  className="bc-tap"
                  style={{
                    flexShrink: 0, border: "none", cursor: "pointer",
                    background: "transparent", padding: "4px 4px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: sel ? c.tint : "var(--bc-chip)",
                      color: sel ? "#fff" : c.tint,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-newsreader), serif",
                      fontSize: 22, letterSpacing: "-0.02em",
                      boxShadow: sel ? `0 4px 12px ${c.tint}55` : "none",
                      transition: "background 160ms, color 160ms, box-shadow 160ms",
                    }}
                  >
                    {c.glyph}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontSize: 11, color: sel ? "var(--bc-ink)" : "var(--bc-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.glyph}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split with */}
        <div>
          <div
            style={{
              padding: "0 4px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <BCSectionLabel>{dict.split_with ?? "Split with"}</BCSectionLabel>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11, color: "var(--bc-muted)", letterSpacing: "0.04em",
              }}
            >
              {(dict.each ?? "{0} EACH").replace("{0}", sym + perPerson.toFixed(2))}
            </div>
          </div>
          <BCCard padded={false}>
            {members.map((m, i) => {
              const has = selected.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className="bc-tap"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    borderTop: i === 0 ? "none" : "1px solid var(--bc-softhair)",
                    cursor: "pointer",
                  }}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={32} />
                  <div
                    style={{
                      flex: 1, minWidth: 0,
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontWeight: 500, fontSize: 14.5, color: "var(--bc-ink)",
                    }}
                  >
                    {m.displayName}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 12,
                      color: has ? "var(--bc-ink)" : "var(--bc-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {has ? `${sym}${perPerson.toFixed(2)}` : "—"}
                  </div>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: has ? "var(--bc-accent)" : "transparent",
                      border: has ? "none" : "1.6px solid var(--bc-hair)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 160ms",
                    }}
                  >
                    {has && <BCIcon name="check" size={14} color="#fff" strokeWidth={2.4} />}
                  </div>
                </div>
              );
            })}
          </BCCard>
        </div>
      </div>

      {/* Save button */}
      <div style={{ padding: "4px 16px 16px" }}>
        <button
          type="button"
          disabled={pending || !paidBy || !selected.length || !(amount > 0)}
          onClick={handleSave}
          className="bc-tap"
          style={{
            background: "var(--bc-accent)",
            color: "#fff",
            border: "none",
            padding: "15px 22px",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontWeight: 500, fontSize: 16,
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            opacity: (pending || !paidBy || !selected.length || !(amount > 0)) ? 0.4 : 1,
          }}
        >
          <BCIcon name="check" size={18} color="#fff" strokeWidth={2.2} />
          {pending ? "…" : (dict.save ?? "Save expense")}
        </button>
      </div>
    </div>
  );
}

// Wrapper that calls addExpense with the pre-computed even splits
async function addExpenseWithSplit(
  groupId: string,
  formData: FormData,
  splitWith: string[],
  perPerson: number
) {
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paidBy = formData.get("paidBy") as string;
  const date = formData.get("date") as string;
  const category = formData.get("category") as string;

  // Build a new FormData for the server action that uses "amount" split method
  const fd = new FormData();
  fd.set("description", description);
  fd.set("amount", amount.toFixed(2));
  fd.set("paidBy", paidBy);
  fd.set("date", date);
  fd.set("category", category);

  // Set per-member amounts for the "amount" split method
  for (const mid of splitWith) {
    fd.set(`split_${mid}`, perPerson.toFixed(2));
  }

  // Mark members NOT in splitWith as 0
  await addExpense(groupId, fd, "amount");
}
