"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/admin", label: "Admin Panel", roles: ["ADMIN"] },
  { href: "/manage", label: "Manage Teams", roles: ["ADMIN", "CAPTAIN"] },
  { href: "/audit", label: "Audit Log", roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", roles: ["ADMIN"] },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const visibleLinks = navLinks.filter((link) => {
    if (!link.roles) return true;
    if (!session?.user) return false;
    return link.roles.includes(session.user.role);
  });

  return (
    <nav className="bg-gradient-to-r from-cricket-900 via-cricket-800 to-cricket-900 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🏏</span>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">Align Sports League</span>
                <span className="hidden sm:block text-[10px] text-cricket-300 font-medium -mt-0.5">Align Cricket Tournament 2026</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-white/15 text-white"
                      : "text-cricket-200 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Register Now
            </Link>
            {status === "loading" && (
              <span className="text-sm text-cricket-300 animate-pulse">...</span>
            )}
            {status === "authenticated" && session.user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{session.user.name}</p>
                  <p className="text-[10px] text-cricket-300">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-cricket-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {status === "unauthenticated" && (
              <button
                onClick={() => signIn()}
                className="text-sm bg-white/15 text-white px-4 py-2 rounded-lg hover:bg-white/25 transition-colors font-medium backdrop-blur-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/10">
        <div className="flex overflow-x-auto gap-1 px-4 py-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "text-cricket-200 hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
