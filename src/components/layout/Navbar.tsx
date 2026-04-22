"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/register", label: "Register" },
  { href: "/manage", label: "Manage Teams", roles: ["ADMIN", "CAPTAIN"] },
  { href: "/audit", label: "Audit Log", roles: ["ADMIN"] },
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏏</span>
              <span className="font-bold text-xl text-gray-900">Cricket Cup</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-cricket-50 text-cricket-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status === "loading" && (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
            {status === "authenticated" && session.user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {status === "unauthenticated" && (
              <button
                onClick={() => signIn()}
                className="text-sm bg-cricket-600 text-white px-4 py-2 rounded-lg hover:bg-cricket-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-100">
        <div className="flex overflow-x-auto gap-1 px-4 py-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-cricket-50 text-cricket-700"
                  : "text-gray-600 hover:bg-gray-50"
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
