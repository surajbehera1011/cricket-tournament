"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CricketDashboard } from "@/components/dashboard/CricketDashboard";
import { PickleballDashboard } from "@/components/dashboard/PickleballDashboard";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

type Sport = "cricket" | "pickleball";

const SPORTS: { id: Sport; label: string; icon: string; accent: string; active: string }[] = [
  { id: "cricket", label: "Cricket", icon: "🏏", accent: "hover:bg-brand-50", active: "bg-brand-600 text-white shadow-md" },
  { id: "pickleball", label: "Pickleball", icon: "🏓", accent: "hover:bg-emerald-50", active: "bg-emerald-600 text-white shadow-md" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvMode = searchParams.get("tv") === "true";
  const sportParam = searchParams.get("sport");
  const initialSport: Sport = sportParam === "pickleball" ? "pickleball" : "cricket";
  const [sport, setSport] = useState<Sport>(initialSport);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("asl-banner-dismissed") === "1";
    }
    return false;
  });

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("asl-banner-dismissed", "1");
  };

  const handleSportChange = (s: Sport) => {
    setSport(s);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sport", s);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="text-sm text-white/90 font-medium">Live Tournament Dashboard</span>
            </div>
            <h1 className={`font-black text-white tracking-tight ${tvMode ? "text-tv-3xl" : "text-4xl sm:text-5xl"}`}>
              Align Sports League
            </h1>
            <p className={`mt-3 text-white/70 max-w-lg mx-auto ${tvMode ? "text-tv-base" : "text-base"}`}>
              Track all tournaments and progress in real-time
            </p>
            {!tvMode && (
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Check your registration status
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sport Selector - overlapping hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-6">
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-white p-1.5 rounded-2xl shadow-lg border border-brand-100/50">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSportChange(s.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  sport === s.id ? s.active : `text-slate-500 ${s.accent}`
                )}
              >
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      {!tvMode && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="relative bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-200/60 rounded-2xl px-5 py-4 shadow-sm">
            <button
              onClick={dismissBanner}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors text-lg"
              aria-label="Dismiss"
            >
              &times;
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 mb-1">New: Registration Status Tracker</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Registered but don&apos;t see your name on the dashboard? All registrations require admin approval.
                  You can now check your registration status anytime using your email.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors"
                >
                  Check Status
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sport-specific dashboard */}
      {sport === "cricket" && <CricketDashboard tvMode={tvMode} />}
      {sport === "pickleball" && <PickleballDashboard />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mx-auto" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
