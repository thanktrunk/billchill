"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BCIcon } from "@/components/bc-ui";
import { useTranslations, useLocale } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");

  const tabs = [
    { k: "home",     href: `/${locale}/groups`,        label: t("groups"),        icon: "home" },
    { k: "activity", href: `/${locale}/notifications`, label: t("notifications"), icon: "activity" },
    { k: "profile",  href: `/${locale}/profile`,       label: t("profile"),       icon: "user" },
  ];

  function isActive(href: string) {
    return pathname === href || (href !== `/${locale}` && pathname.startsWith(href));
  }

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: 6,
          background: "var(--bc-ink)",
          color: "var(--bc-bg)",
          borderRadius: 999,
          pointerEvents: "auto",
          boxShadow: "0 14px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        {tabs.map((t) => {
          const sel = isActive(t.href);
          return (
            <Link
              key={t.k}
              href={t.href}
              className="bc-tap"
              style={{
                border: "none",
                cursor: "pointer",
                background: sel ? "var(--bc-bg)" : "transparent",
                color: sel ? "var(--bc-ink)" : "rgba(245,241,234,0.8)",
                padding: sel ? "10px 18px" : "10px 14px",
                borderRadius: 999,
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 200ms, padding 200ms, color 200ms",
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              <BCIcon
                name={t.icon}
                size={18}
                color={sel ? "var(--bc-ink)" : "rgba(245,241,234,0.8)"}
                strokeWidth={1.7}
              />
              {sel && <span>{t.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
