import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Every page and API route requires a signed session cookie, except the login flow.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" || pathname === "/api/login") {
    if (authed && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals and static files in /public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
