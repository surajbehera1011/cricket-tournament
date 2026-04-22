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
