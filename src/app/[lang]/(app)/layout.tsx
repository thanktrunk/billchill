import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { notFound } from "next/navigation";
import { BCIcon } from "@/components/bc-ui";
import { hasLocale } from "@/lib/i18n";
import { getTranslations } from "next-intl/server";

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations("landing"),
  ]);

  if (!user) {
    return <LandingPage lang={lang} />;
  }

  return (
    <div
      className="relative min-h-dvh"
      style={{ background: "var(--bc-bg)", color: "var(--bc-ink)" }}
    >
      <main className="pb-safe-nav">{children}</main>
      <BottomNav />
    </div>
  );
}

// ── Landing page (shown when not signed in) ───────────────────────
async function LandingPage({ lang }: { lang: string }) {
  const L = await getTranslations("landing");
  const tBrand = await getTranslations("common");
  const tagline = L("tagline").split("\n");

  const features = [
    { glyph: "L", tint: "#1A1A1A", t: L("feature_ledger_t"), b: L("feature_ledger_b") },
    { glyph: "S", tint: "#3F6E55", t: L("feature_smart_t"),  b: L("feature_smart_b") },
    { glyph: "¤", tint: "#B7873A", t: L("feature_multi_t"),  b: L("feature_multi_b") },
  ];

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
          padding: "4px 22px 0",
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
          {lang === "vi" ? "VN" : "EN"}
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 22px 0" }}>
        <LedgerHero />
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
                whiteSpace: "nowrap",
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
          {L("subhead")}
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
          padding: "24px 22px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <a
          href={`/auth/login?returnTo=/${lang}/groups`}
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
          {L("cta_login")}
          <BCIcon name="arrowR" size={18} color="var(--bc-bg)" strokeWidth={2.2} />
        </a>
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 11,
            color: "var(--bc-muted)",
            textAlign: "center",
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
          }}
        >
          {L("legal")}
        </div>
      </div>
    </div>
  );
}

function LedgerHero() {
  return (
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
      {/* Receipt 2 (mid) — with avatar stack */}
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
        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
          {["S", "J", "N"].map((initial, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: ["#E5572F", "#3F6E55", "#B7873A"][i],
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              {initial}
            </div>
          ))}
        </div>
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
          Settle up
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
            4 people · 1 transfer
          </div>
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
