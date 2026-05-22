"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BCNumPad, BCAmountDisplay, BCButton, BCTopBar, BCIcon } from "@/components/bc-ui";
import { recordSettlement } from "./actions";

type Member = { id: string; displayName: string };

type Debt = { from: string; to: string; amount: number };

type Dict = Record<string, Record<string, string>>;

function fmt(amount: number, currency: string) {
  const syms: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
  return (syms[currency] ?? currency) + amount.toFixed(2);
}

export function SettleForm({
  lang,
  groupId,
  currency,
  members,
  suggestedDebt,
  dict,
}: {
  lang: string;
  groupId: string;
  currency: string;
  members: Member[];
  suggestedDebt: Debt | null;
  dict: Dict;
}) {
  const router = useRouter();
  const t = dict.settle ?? {};

  const [fromId, setFromId] = useState(suggestedDebt?.from ?? members[0]?.id ?? "");
  const [toId, setToId] = useState(suggestedDebt?.to ?? members[1]?.id ?? "");
  const [rawAmount, setRawAmount] = useState(
    suggestedDebt ? String(Math.round(suggestedDebt.amount * 100)) : "0"
  );
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = parseInt(rawAmount || "0", 10) / 100;
  const syms: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
  const sym = syms[currency] ?? currency;

  function handleNumPad(key: string) {
    setRawAmount((prev) => {
      if (key === "del") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (key === "." ) return prev;
      if (prev === "0") return key;
      if (prev.length >= 8) return prev;
      return prev + key;
    });
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  async function handleRecord() {
    if (amount <= 0 || !fromId || !toId || fromId === toId) return;
    setLoading(true);
    setError("");
    try {
      await recordSettlement(groupId, fromId, toId, amount);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70dvh",
          gap: 12,
          padding: "0 32px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--bc-pos)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <BCIcon name="check" size={28} color="#fff" />
        </div>
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 30,
            color: "var(--bc-ink)",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {t.done_title ?? "Recorded."}
        </div>
        <div
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 14,
            color: "var(--bc-muted)",
            textAlign: "center",
          }}
        >
          {t.done_subtitle ?? "Books are a little lighter."}
        </div>
        <div style={{ marginTop: 24 }}>
          <BCButton
            variant="primary"
            onClick={() => router.push(`/${lang}/groups/${groupId}`)}
          >
            {t.back_to_group ?? "Back to group"}
          </BCButton>
        </div>
      </div>
    );
  }

  const fromMember = members.find((m) => m.id === fromId);
  const toMember = members.find((m) => m.id === toId);
  const suggestedAmt = suggestedDebt?.amount;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bc-bg)" }}>
      <BCTopBar
        title={t.title ?? "Settle Up"}
        left={
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
          >
            <BCIcon name="back" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      {/* From / To */}
      <div style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            background: "var(--bc-surface)",
            borderRadius: 20,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* From */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 11,
                color: "var(--bc-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              {t.from ?? "From"}
            </div>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--bc-ink)",
                outline: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "var(--bc-chip)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BCIcon name="swap" size={16} color="var(--bc-muted)" />
          </button>

          {/* To */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 11,
                color: "var(--bc-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              {t.to ?? "To"}
            </div>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--bc-ink)",
                outline: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
        <BCAmountDisplay
        value={(parseInt(rawAmount || "0", 10) / 100).toFixed(2)}
        currency={sym}
      />

        {suggestedAmt && (
          <button
            onClick={() => setRawAmount(String(Math.round(suggestedAmt * 100)))}
            style={{
              marginTop: 10,
              background: "var(--bc-chip)",
              border: "none",
              borderRadius: 999,
              padding: "6px 16px",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 13,
              color: "var(--bc-muted)",
              cursor: "pointer",
            }}
          >
            {t.suggested?.replace("{0}", fmt(suggestedAmt, currency)) ??
              `Suggested ${fmt(suggestedAmt, currency)}`}
          </button>
        )}
      </div>

      {/* Numpad */}
      <div style={{ flex: 1, padding: "8px 16px 0" }}>
        <BCNumPad onKey={handleNumPad} />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            margin: "0 20px",
            padding: "10px 14px",
            background: "rgba(229,87,47,0.1)",
            borderRadius: 12,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 13,
            color: "var(--bc-accent)",
          }}
        >
          {error}
        </div>
      )}

      {/* Record button */}
      <div style={{ padding: "12px 20px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <BCButton
          variant={amount > 0 && fromId !== toId ? "accent" : "ghost"}
          onClick={handleRecord}
          disabled={loading || amount <= 0 || fromId === toId}
          full
        >
          {loading ? "…" : (t.record ?? "Record Payment")}
        </BCButton>
      </div>
    </div>
  );
}
