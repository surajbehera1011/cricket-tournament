"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
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
    <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-brand-100/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🏏</span>
              <div>
                <span className="font-extrabold text-lg text-brand-700 tracking-tight">Align Sports League</span>
                <span className="hidden sm:block text-[10px] text-brand-400 font-medium -mt-0.5">Align Cricket Tournament 2026</span>
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
                      ? "bg-brand-100 text-brand-700"
                      : "text-slate-500 hover:text-brand-700 hover:bg-brand-50"
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
              className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-all font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Register Now
            </Link>
            {status === "loading" && (
              <span className="text-sm text-brand-300 animate-pulse">...</span>
            )}
            {status === "authenticated" && session.user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">{session.user.name}</p>
                  <p className="text-[10px] text-brand-400">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-slate-500 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {status === "unauthenticated" && (
              <button
                onClick={() => signIn()}
                className="text-sm bg-brand-50 text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors font-medium border border-brand-200"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-brand-100/60">
        <div className="flex overflow-x-auto gap-1 px-4 py-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-brand-100 text-brand-700"
                  : "text-slate-500 hover:bg-brand-50"
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
