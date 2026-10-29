import { NextResponse, type NextRequest } from "next/server";

// A quick first gate for /admin: no session cookie → go to the login page.
// This only checks that a cookie exists. The real check (is the session valid,
// is the user an administrator?) happens on the server in every admin page and action.

const SESSION_COOKIES = ["__Host-archive_session", "archive_session"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
