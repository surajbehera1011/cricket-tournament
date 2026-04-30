"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/master", label: "Approvals", roles: ["MASTER"] },
  { href: "/manage", label: "Manage Teams", roles: ["ADMIN", "CAPTAIN"] },
];

const adminDropdownLinks = [
  { href: "/admin", label: "Admin Panel" },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/audit", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSport = searchParams.get("sport") || "pickleball";
  const isAdmin = session?.user?.role === "ADMIN";
  const isAdminPage = adminDropdownLinks.some((l) => pathname === l.href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((s) => {
        if (s.registrationOpen !== undefined) setRegistrationOpen(s.registrationOpen);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visiblePrimary = primaryLinks.filter((link) => {
    if (!link.roles) return true;
    if (!session?.user) return false;
    return link.roles.includes(session.user.role);
  });

  const allVisibleLinks = [
    ...visiblePrimary,
    ...(isAdmin ? adminDropdownLinks : []),
  ];

  const registerHref = `/register?sport=${currentSport}`;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-dark-600/95 backdrop-blur-xl border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-dark-600/80 backdrop-blur-md border-white/[0.04]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/images/align-logo.png" alt="Align" className="h-12 w-12 rounded-xl object-cover group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">Sports League</span>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-0.5">Cricket & Pickleball 2026</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {visiblePrimary.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAdminOpen((v) => !v)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1",
                      isAdminPage
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    Admin
                    <svg
                      className={cn("w-3.5 h-3.5 transition-transform", adminOpen && "rotate-180")}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 py-1.5 rounded-xl bg-dark-500/95 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30">
                      {adminDropdownLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setAdminOpen(false)}
                          className={cn(
                            "block px-4 py-2 text-sm font-medium transition-colors",
                            pathname === link.href
                              ? "bg-white/10 text-white"
                              : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {registrationOpen && (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/?tour=1"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                  title="Take a tour"
                  aria-label="Take a tour"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
                <Link
                  href={registerHref}
                  className="text-sm bg-gradient-to-r from-pitch-500 to-pitch-600 text-white px-4 py-2 rounded-lg hover:from-pitch-400 hover:to-pitch-500 transition-all font-bold shadow-lg shadow-pitch-500/25 hover:shadow-pitch-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Register Now
                </Link>
              </div>
            )}
            {status === "loading" && (
              <span className="text-sm text-slate-500 animate-pulse">...</span>
            )}
            {status === "authenticated" && session.user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{session.user.name}</p>
                  <p className="text-[10px] text-slate-400">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {status === "unauthenticated" && (
              <button
                onClick={() => signIn()}
                className="text-sm bg-white/[0.06] text-slate-300 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors font-medium border border-white/[0.08]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/[0.04]">
        <div className="flex overflow-x-auto gap-1 px-4 py-2">
          {allVisibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/[0.06]"
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
