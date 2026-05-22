import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LocaleProvider } from "@/lib/locale-context";
import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";
import { BCIcon } from "@/components/bc-ui";

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, dict] = await Promise.all([
    getCurrentUser(),
    getDictionary(lang),
  ]);

  // Not logged in — show landing page (full screen, no nav)
  if (!user) {
    return <LandingPage lang={lang} />;
  }

  return (
    <LocaleProvider lang={lang} dict={dict}>
      <div
        className="relative min-h-dvh"
        style={{ background: "var(--bc-bg)", color: "var(--bc-ink)" }}
      >
        <main className="pb-safe-nav">{children}</main>
        <BottomNav />
      </div>
    </LocaleProvider>
  );
}

// ── Landing page (shown when not signed in) ───────────────────────
function LandingPage({ lang }: { lang: string }) {
  const isVi = lang === "vi";

  const tagline = isVi
    ? ["Cho bạn bè", "và tiền nhà chung"]
    : ["For friends, trips,", "and long shared rents"];

  const subhead = isVi
    ? "Chia chi tiêu không cần bảng tính. Theo dõi ai trả, ai nợ, và quyết toán gọn gàng."
    : "Split expenses without the spreadsheet. Track who paid, who owes, and settle up clean.";

  const features = isVi
    ? [
        { glyph: "L", tint: "#1A1A1A", t: "Sổ chung nhóm",       b: "Một sổ chạy cho mỗi nhóm" },
        { glyph: "S", tint: "#3F6E55", t: "Quyết toán thông minh", b: "Số lần chuyển tiền ít nhất" },
        { glyph: "¤", tint: "#B7873A", t: "Đa tiền tệ",           b: "Du lịch €, tiền nhà $" },
      ]
    : [
        { glyph: "L", tint: "#1A1A1A", t: "Shared ledgers",   b: "One running tab per group" },
        { glyph: "S", tint: "#3F6E55", t: "Smart settle-up",  b: "The fewest payments to clear" },
        { glyph: "¤", tint: "#B7873A", t: "Any currency",     b: "A trip in €, rent in $" },
      ];

  const ctaLabel = isVi ? "Tiếp tục" : "Continue";
  const legal = isVi
    ? "Miễn phí cho bạn bè. Tiếp tục nghĩa là bạn đồng ý điều khoản."
    : "Free for friends. By continuing you agree to the terms.";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bc-bg)",
        color: "var(--bc-ink)",
        maxWidth: 480,
        margin: "0 auto",
        padding: "env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top — brand + lang indicator */}
      <div
        style={{
          padding: "16px 22px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 28,
            color: "var(--bc-ink)",
            letterSpacing: "-0.015em",
          }}
        >
          billchill
        </div>
        <div
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 11,
            color: "var(--bc-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {lang.toUpperCase()}
        </div>
      </div>

      {/* Hero — tilted receipt stack */}
      <div style={{ padding: "24px 22px 0" }}>
        <div style={{ position: "relative", height: 168 }}>
          {/* Receipt 3 (back) */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 16,
              width: 220,
              height: 132,
              background: "var(--bc-surface)",
              border: "1px solid var(--bc-softhair)",
              borderRadius: 16,
              transform: "rotate(-6deg)",
              padding: 14,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <ReceiptLine w="60%" />
            <ReceiptLine w="42%" />
            <ReceiptLine w="50%" />
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 22,
                color: "#3F6E55",
                letterSpacing: "-0.01em",
                alignSelf: "flex-end",
              }}
            >
              $84.30
            </div>
          </div>
          {/* Receipt 2 (mid) */}
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 6,
              width: 230,
              height: 138,
              background: "var(--bc-surface)",
              border: "1px solid var(--bc-softhair)",
              borderRadius: 16,
              transform: "rotate(4deg)",
              padding: 14,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
            }}
          >
            <ReceiptLine w="70%" />
            <ReceiptLine w="55%" />
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 28,
                color: "var(--bc-ink)",
                letterSpacing: "-0.015em",
              }}
            >
              €88.50
            </div>
          </div>
          {/* Receipt 1 (front) — accent */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              width: 200,
              height: 110,
              transform: "translateX(-50%) rotate(-1.5deg)",
              background: "var(--bc-accent)",
              color: "#fff",
              borderRadius: 16,
              padding: 14,
              boxSizing: "border-box",
              boxShadow: "0 14px 30px rgba(229,87,47,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {isVi ? "Quyết toán" : "Settle up"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 36,
                marginTop: 4,
                letterSpacing: "-0.02em",
              }}
            >
              $1,270.22
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BCIcon name="check" size={12} color="#fff" strokeWidth={2.6} />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "-0.005em",
                }}
              >
                {isVi ? "4 người · 1 chuyển khoản" : "4 people · 1 transfer"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ padding: "28px 26px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 40,
            lineHeight: 1.02,
            color: "var(--bc-ink)",
            letterSpacing: "-0.025em",
          }}
        >
          {tagline.map((line, i) => (
            <div
              key={i}
              style={{
                fontStyle: i === 1 ? "italic" : "normal",
                color: i === 1 ? "var(--bc-accent)" : "var(--bc-ink)",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 15,
            color: "var(--bc-muted)",
            letterSpacing: "-0.005em",
            lineHeight: 1.45,
            maxWidth: 320,
          }}
        >
          {subhead}
        </div>
      </div>

      {/* Features */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: "12px 26px 0",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {features.map((f) => (
          <div key={f.t} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                flexShrink: 0,
                background: f.tint,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 20,
              }}
            >
              {f.glyph}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: "var(--bc-ink)",
                  letterSpacing: "-0.005em",
                }}
              >
                {f.t}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 12,
                  color: "var(--bc-muted)",
                  marginTop: 2,
                }}
              >
                {f.b}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div
        style={{
          padding: "24px 22px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <a
          href="/auth/login"
          style={{
            background: "var(--bc-ink)",
            color: "var(--bc-bg)",
            border: "none",
            padding: "16px 22px",
            borderRadius: 999,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: "-0.005em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          {ctaLabel}
          <BCIcon name="arrowR" size={18} color="var(--bc-bg)" strokeWidth={2.2} />
        </a>
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 11,
            color: "var(--bc-muted)",
            textAlign: "center",
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
          }}
        >
          {legal}
        </div>
      </div>
    </div>
  );
}

function ReceiptLine({ w }: { w: string }) {
  return (
    <div
      style={{ width: w, height: 6, borderRadius: 6, background: "var(--bc-chip)" }}
    />
  );
}
