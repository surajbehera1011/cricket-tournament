import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/manage", "/audit", "/settings"];
const apiMutationPaths = ["/api/register", "/api/teams/", "/api/settings", "/api/admin", "/api/players"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPaths.some((p) => pathname.startsWith(p));
  const isApiMutation =
    apiMutationPaths.some((p) => pathname.startsWith(p)) &&
    (request.method === "POST" || request.method === "PATCH" || request.method === "PUT");

  if (!isProtectedPage && !isApiMutation) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    if (isApiMutation) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/audit") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/settings") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/manage") &&
    token.role !== "ADMIN" &&
    token.role !== "CAPTAIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/audit/:path*", "/settings/:path*", "/api/register/:path*", "/api/teams/:path*", "/api/settings", "/api/admin/:path*", "/api/players/:path*"],
};
