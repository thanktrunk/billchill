import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { defaultLocale, hasLocale } from "@/lib/i18n";
import Negotiator from "negotiator";

function getPreferredLocale(req: NextRequest): string {
  const acceptLanguage = req.headers.get("accept-language") ?? "";
  const languages = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  }).languages();

  for (const lang of languages) {
    const base = lang.split("-")[0].toLowerCase();
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth0 handles /auth/* routes — run its proxy and return early
  if (pathname.startsWith("/auth")) {
    return auth0.middleware(req);
  }

  // Check whether the URL already contains a supported locale prefix
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  const pathnameHasLocale = hasLocale(firstSegment);

  if (!pathnameHasLocale) {
    // Redirect to locale-prefixed path
    const locale = getPreferredLocale(req);
    req.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(req.nextUrl);
  }

  // Locale is present — run auth check
  const authRes = await auth0.middleware(req);
  const session = await auth0.getSession(req);
  if (!session) {
    return NextResponse.redirect(
      new URL(
        "/auth/login?returnTo=" + encodeURIComponent(pathname),
        req.url
      )
    );
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icon-.*\\.svg|.*\\.png).*)",
  ],
};
