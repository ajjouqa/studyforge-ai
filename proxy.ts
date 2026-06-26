import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, verifyToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  // No password configured -> app is open (frictionless local dev).
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const ok = await verifyToken(token);

  if (!ok && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (ok && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/courses";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
