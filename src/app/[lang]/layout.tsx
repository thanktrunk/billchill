import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Newsreader, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale } from "@/lib/i18n";
import "../globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: "meta" });
  const tCommon = await getTranslations({ locale: lang, namespace: "common" });
  return {
    title: t("title"),
    description: t("description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: tCommon("app_name"),
    },
    formatDetection: { telephone: false },
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "vi" }];
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const messages = await getMessages({ locale: lang });

  return (
    <html
      lang={lang}
      className={`${newsreader.variable} ${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <Auth0Provider>
        <body className="min-h-full flex flex-col">
          <NextIntlClientProvider locale={lang} messages={messages}>
            {children}
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
        </body>
      </Auth0Provider>
    </html>
  );
}
