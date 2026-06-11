import { NextRequest, NextResponse } from "next/server";

/**
 * Preview password gate.
 * Set PREVIEW_PASSWORD in .env.local to enable.
 * When set, all pages require a password cookie to access.
 * Remove the env var (or set to empty) to disable the gate.
 */

const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD || "";
const COOKIE_NAME = "ds_preview_access";

export function middleware(request: NextRequest) {
  // If no preview password is set, allow all traffic
  if (!PREVIEW_PASSWORD) {
    return NextResponse.next();
  }

  // Allow the preview login page itself
  if (request.nextUrl.pathname === "/preview-login") {
    return NextResponse.next();
  }

  // Allow the preview login API route
  if (request.nextUrl.pathname === "/api/preview-login") {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/brand") ||
    request.nextUrl.pathname.startsWith("/images") ||
    request.nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check for preview access cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === PREVIEW_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to preview login
  const loginUrl = new URL("/preview-login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
