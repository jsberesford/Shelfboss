import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRole } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export default auth((req) => {
  if ((process.env.NODE_ENV as string) === "development") return NextResponse.next();

  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  // Public routes
  if (nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/api/auth")) {
    if (isLoggedIn) {
      const role = session.user.role as Role;
      const destination = isAdminRole(role) ? "/dashboard" : "/m";
      return NextResponse.redirect(new URL(destination, nextUrl));
    }
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  const role = session.user.role as Role;

  // Admin routes — warehouse staff and viewers get redirected to mobile
  const adminPaths = ["/dashboard", "/inventory", "/orders", "/reports", "/users", "/vendors", "/audit-log"];
  const isAdminPath = adminPaths.some((p) => nextUrl.pathname.startsWith(p));

  if (isAdminPath && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/m", nextUrl));
  }

  // Users management — only SUPER_ADMIN
  if (nextUrl.pathname.startsWith("/users") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Audit log — managers and above
  if (nextUrl.pathname.startsWith("/audit-log") && role === "VIEWER") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest).*)"],
};
