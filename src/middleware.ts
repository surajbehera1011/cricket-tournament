import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminOnlyPages = ["/admin", "/audit", "/settings"];
const masterOnlyPages = ["/master"];
const authRequiredPages = ["/manage"];
const adminOnlyApi = ["/api/admin", "/api/settings"];
const masterOnlyApi = ["/api/master"];
const authRequiredApi = ["/api/teams/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const isAdminPage = adminOnlyPages.some((p) => pathname.startsWith(p));
  const isMasterPage = masterOnlyPages.some((p) => pathname.startsWith(p));
  const isAuthPage = authRequiredPages.some((p) => pathname.startsWith(p));
  const isAdminApi = adminOnlyApi.some((p) => pathname.startsWith(p)) && method !== "GET";
  const isMasterApi = masterOnlyApi.some((p) => pathname.startsWith(p));
  const isAuthApi = authRequiredApi.some((p) => pathname.startsWith(p)) && (method === "POST" || method === "PATCH" || method === "PUT");
  const isPlayerApi = pathname.startsWith("/api/players") && method === "PATCH";

  if (!isAdminPage && !isMasterPage && !isAuthPage && !isAdminApi && !isMasterApi && !isAuthApi && !isPlayerApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    if (isAdminApi || isMasterApi || isAuthApi || isPlayerApi) {
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

  if (isMasterPage || isMasterApi) {
    if (token.role !== "MASTER" && token.role !== "ADMIN") {
      if (isMasterApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isAuthPage && token.role !== "ADMIN" && token.role !== "CAPTAIN" && token.role !== "MASTER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/master/:path*",
    "/manage/:path*",
    "/audit/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
    "/api/master/:path*",
    "/api/settings",
    "/api/teams/:path*",
    "/api/players/:path*",
  ],
};
