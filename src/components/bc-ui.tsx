"use client";

import { cn } from "@/lib/utils";

// ── Avatar color palette (stable hash) ───────────────────────────
const AVATAR_COLORS = [
  "#E5572F", "#3F6E55", "#B7873A", "#7B5E8C",
  "#4A6B7C", "#A4452C", "#5B6E3F", "#8C5E3E",
];
export function avatarColor(seed: string | number): string {
  const s =
    typeof seed === "string"
      ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      : seed;
  return AVATAR_COLORS[Math.abs(s) % AVATAR_COLORS.length];
}

// ── Category config ───────────────────────────────────────────────
export const BC_CATEGORIES: Record<string, { labelKey: string; glyph: string; tint: string }> = {
  food:      { labelKey: "cat.food",       glyph: "F", tint: "#E5572F" },
  drinks:    { labelKey: "cat.drinks",     glyph: "D", tint: "#7B5E8C" },
  transport: { labelKey: "cat.transport",  glyph: "T", tint: "#4A6B7C" },
  lodging:   { labelKey: "cat.lodging",    glyph: "L", tint: "#B7873A" },
  groceries: { labelKey: "cat.groceries",  glyph: "G", tint: "#3F6E55" },
  fun:       { labelKey: "cat.fun",        glyph: "E", tint: "#A4452C" },
  utilities: { labelKey: "cat.utilities",  glyph: "U", tint: "#5B6E3F" },
  other:     { labelKey: "cat.other",      glyph: "·", tint: "#6B6359" },
};

// ── SVG Icon ──────────────────────────────────────────────────────
const ICON_PATHS: Record<string, React.ReactNode> = {
  plus:     <path d="M12 5v14M5 12h14" />,
  arrow:    <path d="M19 12H5M12 5l-7 7 7 7" />,
  arrowR:   <path d="M5 12h14M12 5l7 7-7 7" />,
  back:     <path d="M15 6l-6 6 6 6" />,
  close:    <path d="M6 6l12 12M18 6L6 18" />,
  check:    <path d="M5 12l5 5L20 7" />,
  bell:     <path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" />,
  user:     <path d="M20 21a8 8 0 10-16 0M16 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  users:    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm9 0a3 3 0 100-6 3 3 0 000 6zm4 10v-2a4 4 0 00-3-3.87" />,
  dots:     <g><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></g>,
  receipt:  <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4" />,
  settings: <path d="M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.5-2.4 1a7.6 7.6 0 00-1.7-1L15 3h-4l-.3 2.4a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.5 2.4-1a7.6 7.6 0 001.7 1L11 21h4l.3-2.4a7.6 7.6 0 001.7-1l2.4 1 2-3.5L19.4 13z" />,
  archive:  <path d="M3 7h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 7zM3 3h18v4H3zM10 11h4" />,
  minus:    <path d="M5 12h14" />,
  swap:     <path d="M7 4l-3 3 3 3M4 7h11M17 14l3 3-3 3M20 17H9" />,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  home:     <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-3v-7H8v7H5a2 2 0 01-2-2v-9z" />,
  tag:      <path d="M3 12l9-9h8v8l-9 9zM15 9a1 1 0 100-2 1 1 0 000 2z" />,
  arrowLeft: <path d="M19 12H5m7-7l-7 7 7 7" />,
};

export function BCIcon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 1.6,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
export function BCAvatar({
  name = "?",
  seed,
  size = 36,
  ring = false,
}: {
  name?: string;
  seed?: string;
  size?: number;
  ring?: boolean;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const bg = avatarColor(seed || name || "?");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
        fontWeight: 600,
        fontSize: size * 0.42,
        flexShrink: 0,
        boxShadow: ring ? "0 0 0 2px var(--bc-bg)" : "none",
      }}
    >
      {initial}
    </div>
  );
}

export function BCAvatarStack({
  members,
  size = 28,
  max = 4,
}: {
  members: { id: string; displayName: string }[];
  size?: number;
  max?: number;
}) {
  const show = members.slice(0, max);
  const extra = members.length - show.length;
  return (
    <div style={{ display: "flex" }}>
      {show.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <BCAvatar name={m.displayName} seed={m.id} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            borderRadius: size,
            background: "var(--bc-chip)",
            color: "var(--bc-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontWeight: 600,
            fontSize: size * 0.38,
            boxShadow: "0 0 0 2px var(--bc-bg)",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Group glyph ───────────────────────────────────────────────────
export function BCGroupGlyph({ name, size = 44 }: { name: string; size?: number }) {
  const ch = (name || "?").trim().charAt(0).toUpperCase();
  const tint = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: tint,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-newsreader), serif",
        fontSize: size * 0.55,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {ch}
    </div>
  );
}

// ── Category badge ────────────────────────────────────────────────
export function BCCategoryBadge({
  category,
  size = 40,
}: {
  category: string;
  size?: number;
}) {
  const c = BC_CATEGORIES[category] || BC_CATEGORIES.other;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: c.tint,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-newsreader), serif",
        fontWeight: 400,
        fontSize: size * 0.5,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {c.glyph}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────
export function BCCard({
  children,
  padded = true,
  style,
  onClick,
  className,
}: {
  children: React.ReactNode;
  padded?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(onClick && "bc-tap cursor-pointer", className)}
      style={{
        background: "var(--bc-surface)",
        borderRadius: 22,
        border: "1px solid var(--bc-softhair)",
        padding: padded ? 18 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────
export function BCSectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
        fontSize: 11,
        color: "var(--bc-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────
export function BCTopBar({
  left,
  right,
  title,
  subtitle,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 4px",
        minHeight: 52,
      }}
    >
      <div style={{ minWidth: 40, display: "flex", alignItems: "center" }}>{left}</div>
      <div style={{ textAlign: "center", flex: 1 }}>
        {title && (
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontWeight: 500,
              fontSize: 15,
              color: "var(--bc-ink)",
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 11,
              color: "var(--bc-muted)",
              marginTop: 2,
              letterSpacing: "0.04em",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end", gap: 4 }}>
        {right}
      </div>
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────
export function BCIconBtn({
  name,
  onClick,
  href,
  badge,
}: {
  name: string;
  onClick?: () => void;
  href?: string;
  badge?: number;
}) {
  const inner = (
    <>
      <BCIcon name={name} size={20} color="var(--bc-ink)" />
      {badge != null && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            minWidth: 14,
            height: 14,
            padding: "0 4px",
            background: "var(--bc-accent)",
            color: "#fff",
            borderRadius: 999,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 2px var(--bc-bg)",
          }}
        >
          {badge}
        </span>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--bc-ink)",
    position: "relative",
  };

  if (href) {
    return (
      <a href={href} className="bc-tap" style={baseStyle}>
        {inner}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="bc-tap" style={baseStyle}>
      {inner}
    </button>
  );
}

// ── Primary / ghost / quiet button ───────────────────────────────
export function BCButton({
  children,
  onClick,
  variant = "primary",
  full,
  disabled,
  icon,
  type = "button",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "accent" | "ghost" | "quiet" | "danger";
  full?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: "button" | "submit";
  href?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--bc-ink)", color: "var(--bc-bg)" },
    accent:  { background: "var(--bc-accent)", color: "#fff" },
    ghost:   { background: "transparent", color: "var(--bc-ink)", border: "1px solid var(--bc-hair)" },
    quiet:   { background: "var(--bc-chip)", color: "var(--bc-ink)" },
    danger:  { background: "transparent", color: "var(--bc-neg)", border: "1px solid var(--bc-softhair)" },
  };

  const s = styles[variant];
  const baseStyle: React.CSSProperties = {
    ...s,
    padding: "15px 22px",
    borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
    fontWeight: 500,
    fontSize: 16,
    letterSpacing: "-0.005em",
    width: full ? "100%" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    opacity: disabled ? 0.4 : 1,
    border: s.border,
    textDecoration: "none",
  };

  if (href) {
    return (
      <a href={href} className="bc-tap" style={baseStyle}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="bc-tap" style={baseStyle}>
      {icon}
      {children}
    </button>
  );
}

// ── Numpad ────────────────────────────────────────────────────────
export function BCNumPad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 4,
        padding: "0 12px 10px",
      }}
    >
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className="bc-tap"
          style={{
            height: 52,
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 30,
            fontWeight: 400,
            color: "var(--bc-ink)",
            borderRadius: 16,
            cursor: "pointer",
            fontVariantNumeric: "tabular-nums",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bc-chip)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bc-chip)";
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {k === "del" ? (
            <BCIcon name="back" size={20} color="var(--bc-ink)" strokeWidth={1.6} />
          ) : (
            k
          )}
        </button>
      ))}
    </div>
  );
}

// ── Amount display ────────────────────────────────────────────────
export function BCAmountDisplay({
  value,
  currency,
  size = 88,
}: {
  value: string;
  currency: string;
  size?: number;
}) {
  const display = value || "0";
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: "var(--font-newsreader), serif",
          fontSize: size * 0.58,
          color: "var(--bc-muted)",
          marginRight: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {currency}
      </span>
      <span
        style={{
          fontFamily: "var(--font-newsreader), serif",
          fontSize: size,
          color: "var(--bc-ink)",
          lineHeight: 0.95,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {display.includes(".") ? display.split(".")[0] : display}
        {display.includes(".") && (
          <span style={{ fontSize: size * 0.58, color: "var(--bc-muted)" }}>
            .{display.split(".")[1]}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────
export function BCTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { k: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        background: "var(--bc-chip)",
        borderRadius: 18,
        margin: "0 16px",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.k}
          type="button"
          onClick={() => onChange(t.k)}
          className="bc-tap"
          style={{
            flex: 1,
            border: "none",
            cursor: "pointer",
            background: active === t.k ? "var(--bc-surface)" : "transparent",
            color: "var(--bc-ink)",
            padding: "10px 12px",
            borderRadius: 14,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: "-0.005em",
            boxShadow: active === t.k ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            transition: "background 160ms",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Chip / tag button ─────────────────────────────────────────────
export function BCChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bc-tap"
      style={{
        border: "none",
        cursor: "pointer",
        background: active ? "var(--bc-ink)" : "var(--bc-chip)",
        color: active ? "var(--bc-bg)" : "var(--bc-ink)",
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.005em",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function BCSpinner({ color = "var(--bc-accent)" }: { color?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{ animation: "bcSpin 900ms linear infinite" }}
    >
      <style>{`@keyframes bcSpin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="20" cy="20" r="16" stroke={color} strokeOpacity="0.18" strokeWidth="3" fill="none" />
      <path d="M20 4 A 16 16 0 0 1 36 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── Balance badge helper ──────────────────────────────────────────
export function BCBalanceBadge({
  amount,
  currency,
  size = 26,
}: {
  amount: number;
  currency: string;
  size?: number;
}) {
  const isOwed = amount > 0.005;
  const owes = amount < -0.005;
  const settled = !isOwed && !owes;
  return (
    <div style={{ textAlign: "right" }}>
      {settled ? (
        <div
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 12,
            color: "var(--bc-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Settled
        </div>
      ) : (
        <>
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 10,
              color: "var(--bc-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {isOwed ? "You're owed" : "You owe"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: size,
              lineHeight: 1,
              color: isOwed ? "var(--bc-pos)" : "var(--bc-neg)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
              marginTop: 2,
            }}
          >
            {currency}{Math.abs(amount).toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}
