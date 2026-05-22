import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(req: NextRequest) {
  const authRes = await auth0.middleware(req);

  // If Auth0 handled the request (auth routes), return its response
  if (req.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  // For app routes, check if user is authenticated
  const session = await auth0.getSession(req);
  if (!session) {
    return NextResponse.redirect(
      new URL("/auth/login?returnTo=" + encodeURIComponent(req.nextUrl.pathname), req.url)
    );
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
