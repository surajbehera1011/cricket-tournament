import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminOnlyPages = ["/admin", "/audit", "/settings"];
const authRequiredPages = ["/manage"];
const adminOnlyApi = ["/api/admin", "/api/settings"];
const authRequiredApi = ["/api/teams/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const isAdminPage = adminOnlyPages.some((p) => pathname.startsWith(p));
  const isAuthPage = authRequiredPages.some((p) => pathname.startsWith(p));
  const isAdminApi = adminOnlyApi.some((p) => pathname.startsWith(p)) && method !== "GET";
  const isAuthApi = authRequiredApi.some((p) => pathname.startsWith(p)) && (method === "POST" || method === "PATCH" || method === "PUT");
  const isPlayerApi = pathname.startsWith("/api/players") && method === "PATCH";

  if (!isAdminPage && !isAuthPage && !isAdminApi && !isAuthApi && !isPlayerApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    if (isAdminApi || isAuthApi || isPlayerApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminPage || isAdminApi || isPlayerApi) {
    if (token.role !== "ADMIN") {
      if (isAdminApi || isPlayerApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isAuthPage && token.role !== "ADMIN" && token.role !== "CAPTAIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/manage/:path*",
    "/audit/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
    "/api/settings",
    "/api/teams/:path*",
    "/api/players/:path*",
  ],
};
