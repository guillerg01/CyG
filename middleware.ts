import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isApiRoute = pathname.startsWith("/api");

  if (isPublicPath) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/users/:path*",
    "/api/accounts/:path*",
    "/api/expenses/:path*",
    "/api/incomes/:path*",
    "/api/loans/:path*",
    "/api/debts/:path*",
    "/api/conversions/:path*",
    "/api/transactions/:path*",
    "/api/statistics/:path*",
    "/api/categories/:path*",
    "/api/changes/:path*",
    "/login",
    "/register",
  ],
};
