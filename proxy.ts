import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessAdminPanel } from "./lib/rolePermissions";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect admin routes from unauthorized access
  if (pathname.startsWith("/admin")) {
    if (!token) {
      // Not logged in: Redirect to admin login (or home)
      return NextResponse.redirect(new URL("/auth/admin-login", req.url));
    }

    // Logged in but not authorized for admin panel: Redirect to home
    if (!canAccessAdminPanel(token.role as any)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect API admin routes
  if (pathname.startsWith("/api/admin")) {
    if (!token || !canAccessAdminPanel(token.role as any)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }
  }

  // Protect auth routes: prevent logged-in users from accessing sign in/sign up pages
  if (
    token &&
    (pathname === "/auth/signin" ||
      pathname === "/auth/signup" ||
      pathname === "/auth/admin-login")
  ) {
    // If admin or staff is logged in, redirect them to admin panel, otherwise home
    if (canAccessAdminPanel(token.role as any)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Ensure middleware runs on the necessary paths
export const config = {
  matcher: [
    "/auth/signin",
    "/auth/signup",
    "/auth/admin-login",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
