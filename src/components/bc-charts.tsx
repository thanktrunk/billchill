"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

export function fmtCurrency(value: number | undefined, symbol: string) {
  if (value == null) return "";
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtCurrencyShort(value: number, symbol: string) {
  if (value >= 1_000_000)
    return `${symbol}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000)
    return `${symbol}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${symbol}${value.toFixed(0)}`;
}

const TOOLTIP_STYLE = {
  background: "var(--bc-surface)",
  border: "1px solid var(--bc-softhair)",
  borderRadius: 12,
  fontSize: 13,
  fontFamily: "var(--font-be-vietnam-pro)",
};

const YAXIS_TICK = {
  fontSize: 12,
  fill: "var(--bc-ink)",
  fontFamily: "var(--font-be-vietnam-pro)",
};

function BarAmountLabel(props: Record<string, unknown> & { symbol: string }) {
  const { x, y, width, height, value, symbol } = props;
  const nx = Number(x),
    ny = Number(y),
    nw = Number(width),
    nh = Number(height),
    nv = Number(value);
  if (!isFinite(nx) || !isFinite(ny) || !isFinite(nw) || !isFinite(nh) || !isFinite(nv)) return null;
  return (
    <text x={nx + nw + 6} y={ny + nh / 2} dominantBaseline="central" fontSize={11} fontFamily="var(--font-be-vietnam-pro)" fill="var(--bc-muted)">
      {fmtCurrency(nv, symbol)}
    </text>
  );
}

function BarCountLabel(props: Record<string, unknown>) {
  const { x, y, width, height, value } = props;
  const nx = Number(x),
    ny = Number(y),
    nw = Number(width),
    nh = Number(height),
    nv = Number(value);
  if (!isFinite(nx) || !isFinite(ny) || !isFinite(nw) || !isFinite(nh) || !isFinite(nv)) return null;
  return (
    <text x={nx + nw + 6} y={ny + nh / 2} dominantBaseline="central" fontSize={11} fontFamily="var(--font-be-vietnam-pro)" fill="var(--bc-muted)">
      {nv}
    </text>
  );
}

// ─── BCDonutChart ─────────────────────────────────────────────────────────────

type DonutItem = { key: string; name: string; value: number; color: string };

export function BCDonutChart({
  data,
  symbol,
  totalLabel = "Total",
}: {
  data: DonutItem[];
  symbol: string;
  totalLabel?: string;
}) {
  const total = data.reduce((s, e) => s + e.value, 0);
  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [fmtCurrency(value as number, symbol), ""]} contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-sans text-[10px] text-(--bc-muted) uppercase tracking-[0.1em]">{totalLabel}</span>
          <span className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-(--bc-ink)">
            {fmtCurrency(total, symbol)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pb-1">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="font-sans text-[12px] text-(--bc-muted) tracking-tight">{entry.name}</span>
            <span className="font-sans text-[12px] text-(--bc-ink) font-medium">{fmtCurrency(entry.value, symbol)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── BCHorizontalBarChart ─────────────────────────────────────────────────────

type BarItem = { name: string; value: number; color?: string };

export function BCHorizontalBarChart({
  data,
  symbol,
  fill = "var(--bc-accent)",
  labelMode = "amount",
  labelWidth = 90,
  rightMargin = 72,
  nameFontSize = 12,
}: {
  data: BarItem[];
  symbol?: string;
  fill?: string;
  labelMode?: "amount" | "count";
  labelWidth?: number;
  rightMargin?: number;
  nameFontSize?: number;
}) {
  const hasPerCellColor = data.some((d) => d.color);
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 80)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: rightMargin, top: 4, bottom: 4 }}>
        <XAxis type="number" hide allowDecimals={labelMode !== "count"} />
        <YAxis type="category" dataKey="name" width={labelWidth} tick={{ ...YAXIS_TICK, fontSize: nameFontSize }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => labelMode === "amount" ? [fmtCurrency(value as number, symbol ?? ""), ""] : [`${value}`, ""]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar
          dataKey="value"
          fill={fill}
          radius={[0, 6, 6, 0]}
          barSize={22}
          label={
            labelMode === "amount"
              ? (props) => <BarAmountLabel {...props} symbol={symbol ?? ""} />
              : (props) => <BarCountLabel {...props} />
          }
        >
          {hasPerCellColor &&
            data.map((entry, i) => <Cell key={i} fill={entry.color ?? fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── BCAreaChart ──────────────────────────────────────────────────────────────

type AreaItem = { month: string; value: number };

export function BCAreaChart({ data, symbol }: { data: AreaItem[]; symbol: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="bcAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bc-accent)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--bc-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--bc-softhair)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--bc-muted)", fontFamily: "var(--font-be-vietnam-pro)" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(value) => [fmtCurrency(value as number, symbol), ""]} contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="value" stroke="var(--bc-accent)" strokeWidth={2} fill="url(#bcAreaGrad)" dot={{ r: 3, fill: "var(--bc-accent)", strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── BCBubbleChart ────────────────────────────────────────────────────────────

function packCircles(radii: number[]): { x: number; y: number; r: number }[] {
  if (radii.length === 0) return [];
  const placed: { x: number; y: number; r: number }[] = [{ x: 0, y: 0, r: radii[0] }];
  for (let i = 1; i < radii.length; i++) {
    const r = radii[i];
    let bestX = 0, bestY = placed[0].r + r, bestScore = Infinity;
    for (const anchor of placed) {
      for (let a = 0; a < 72; a++) {
        const angle = (a / 72) * Math.PI * 2;
        const x = anchor.x + (anchor.r + r) * Math.cos(angle);
        const y = anchor.y + (anchor.r + r) * Math.sin(angle);
        let valid = true;
        for (const p of placed) {
          if (Math.hypot(x - p.x, y - p.y) < r + p.r - 0.5) { valid = false; break; }
        }
        if (valid) {
          const score = Math.hypot(x, y);
          if (score < bestScore) { bestScore = score; bestX = x; bestY = y; }
        }
      }
    }
    placed.push({ x: bestX, y: bestY, r });
  }
  return placed;
}

type BubbleItem = { name: string; value: number };

export function BCBubbleChart({
  data,
  symbol,
  color = "--bc-pos",
}: {
  data: BubbleItem[];
  symbol: string;
  color?: string;
}) {
  const { placed, viewBox } = useMemo(() => {
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const MAX_R = 80, MIN_R = 22;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const items = sorted.map((d) => ({
      ...d,
      r: Math.max(MIN_R, MAX_R * Math.sqrt(d.value / maxVal)),
      opacity: Math.round(30 + 50 * (d.value / maxVal)),
    }));
    const circles = packCircles(items.map((d) => d.r));
    const PAD = 6;
    const placed = circles.map((c, i) => ({ ...c, name: items[i].name, value: items[i].value, opacity: items[i].opacity }));
    const minX = Math.min(...placed.map((p) => p.x - p.r)) - PAD;
    const maxX = Math.max(...placed.map((p) => p.x + p.r)) + PAD;
    const minY = Math.min(...placed.map((p) => p.y - p.r)) - PAD;
    const maxY = Math.max(...placed.map((p) => p.y + p.r)) + PAD;
    return { placed, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
  }, [data]);

  if (placed.length === 0) return null;

  return (
    <svg viewBox={viewBox} className="w-full h-auto">
      {placed.map((p) => {
        const nameFz = Math.max(9, p.r * 0.24);
        const amtFz = Math.max(10, p.r * 0.32);
        const gap = 3;
        return (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={`color-mix(in srgb, var(${color}) ${p.opacity}%, transparent)`} />
            <text x={p.x} y={p.y - amtFz / 2 - gap / 2} textAnchor="middle" dominantBaseline="middle" fontSize={nameFz} fill="white" fontFamily="var(--font-be-vietnam-pro)">
              {p.name}
            </text>
            <text x={p.x} y={p.y + nameFz / 2 + gap / 2} textAnchor="middle" dominantBaseline="middle" fontSize={amtFz} fontWeight="700" fill="white" fontFamily="var(--font-be-vietnam-pro)">
              {fmtCurrencyShort(p.value, symbol)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
