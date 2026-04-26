"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CricketDashboard } from "@/components/dashboard/CricketDashboard";
import { PickleballDashboard } from "@/components/dashboard/PickleballDashboard";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

type Sport = "cricket" | "pickleball";

const SPORTS: { id: Sport; label: string; icon: string; active: string }[] = [
  { id: "cricket", label: "Cricket", icon: "🏏", active: "bg-pitch-500 text-white shadow-lg shadow-pitch-500/25" },
  { id: "pickleball", label: "Pickleball", icon: "🏓", active: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvMode = searchParams.get("tv") === "true";
  const sportParam = searchParams.get("sport");
  const initialSport: Sport = sportParam === "pickleball" ? "pickleball" : "cricket";
  const [sport, setSport] = useState<Sport>(initialSport);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("asl-tour-completed")) {
      setTourOpen(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      setTourOpen(true);
    }
  }, [searchParams]);

  const handleSportChange = (s: Sport) => {
    setSport(s);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sport", s);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Hero with Cricket Background */}
      <div className="hero-section">
        <div className="hero-bg-image" />
        <div className="hero-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-5 border border-white/10">
              <img src="/images/align-logo.png" alt="Align" className="h-5 w-5 rounded object-cover" />
              <span className="text-sm text-white/90 font-medium tracking-wide">Live Tournament Dashboard</span>
            </div>
            <h1 className={`font-display tracking-wider text-gradient-hero ${tvMode ? "text-tv-3xl" : "text-5xl sm:text-6xl lg:text-7xl"}`}>
              ALIGN SPORTS LEAGUE
            </h1>
            <p className={`mt-4 text-slate-300/80 max-w-lg mx-auto ${tvMode ? "text-tv-base" : "text-base"}`}>
              Track all tournaments and progress in real-time
            </p>
            {!tvMode && (
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 mt-5 text-sm text-slate-400 hover:text-white transition-colors font-medium group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Check your registration status
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sport Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-6">
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-dark-400/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.06] shadow-xl shadow-black/20">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSportChange(s.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  sport === s.id ? s.active : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-pitch-500 mx-auto" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
