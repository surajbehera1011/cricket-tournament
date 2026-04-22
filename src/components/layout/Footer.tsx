"use client";

import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-brand-100/40">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-2xl">🏏</span>
              <div>
                <p className="font-extrabold text-lg text-brand-700 tracking-tight leading-tight">
                  Align Sports League
                </p>
                <p className="text-[11px] text-brand-400 font-medium">
                  Align Cricket Tournament {year}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              The official platform for Align Technology&apos;s internal cricket tournament.
              Register teams, manage squads, and follow the action live.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-slate-600 hover:text-brand-700 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-slate-600 hover:text-brand-700 transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/manage" className="text-sm text-slate-600 hover:text-brand-700 transition-colors">
                  Manage Teams
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Support & Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <a href="mailto:sbehera@aligntech.com" className="text-sm text-slate-600 hover:text-brand-700 transition-colors">
                  sbehera@aligntech.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <a href="tel:+917381929637" className="text-sm text-slate-600 hover:text-brand-700 transition-colors">
                  +91 73819 29637
                </a>
              </li>
              <li className="flex items-start gap-2.5 mt-1">
                <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm text-slate-600">
                    For queries, issues, or feedback about the tournament platform
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            &copy; {year} Align Sports League &middot; Align Technology
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            Designed & Built by
            <a
              href="mailto:sbehera@aligntech.com"
              className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Suraj Behera
            </a>
            <span className="inline-block w-1 h-1 rounded-full bg-brand-400" />
            <span className="text-slate-300">Powered by Next.js</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
