import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow NextAuth API routes and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret:
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET ||
      "ai_career_os_super_secret_jwt_key_2026_auth",
  });

  const isAuth = !!token;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Redirect authenticated users away from login/signup pages
  if (isAuthPage) {
    if (isAuth) {
      const dest = token.onboardingCompleted ? "/dashboard" : "/get-started";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Protect /dashboard, /onboarding, /get-started, /target, /resume, /career-fit, /job-analyzer, and all other /api routes
  if (!isAuth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/get-started",
    "/target",
    "/resume",
    "/career-fit/:path*",
    "/job-analyzer/:path*",
    "/api/:path*",
    "/login",
    "/signup",
  ],
};
