"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TeamCards } from "@/components/dashboard/TeamCards";
import { PoolTable } from "@/components/dashboard/PoolTable";
import { Countdown } from "@/components/dashboard/Countdown";
import { PickleballDashboard } from "@/components/dashboard/PickleballDashboard";
import { useSSE } from "@/lib/useSSE";
import { Suspense } from "react";

interface Team {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  teamSize: number;
  slotsRemaining: number;
  femaleCount: number;
  captainName: string;
  color?: string;
  captain: { displayName: string } | null;
  players: {
    id: string;
    fullName: string;
    preferredRole: string;
    gender?: string;
    email?: string;
    membershipType: string;
    positionSlot: string | null;
  }[];
}

interface PoolPlayer {
  id: string;
  fullName: string;
  preferredRole: string;
  experienceLevel: string;
  gender?: string;
  comments: string | null;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tvMode = searchParams.get("tv") === "true";

  const [teams, setTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [pickleballRegs, setPickleballRegs] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [teamsRes, poolRes, settingsRes, pbRes] = await Promise.all([
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pool?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/settings?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pickleball?_t=${ts}`, { cache: "no-store" }),
      ]);
      const teamsData = await teamsRes.json();
      const poolData = await poolRes.json();
      const settingsData = await settingsRes.json();
      const pbData = await pbRes.json();
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(poolData)) setPool(poolData);
      if (settingsData?.tournamentStartDate) setStartDate(settingsData.tournamentStartDate);
      if (Array.isArray(pbData)) setPickleballRegs(pbData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSSE(fetchData);

  const q = search.toLowerCase();
  const filteredTeams = q
    ? teams.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.captainName?.toLowerCase().includes(q) ||
        t.players.some((p) => p.fullName.toLowerCase().includes(q))
      )
    : teams;

  const filteredPool = q
    ? pool.filter((p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.preferredRole.toLowerCase().includes(q)
      )
    : pool;

  const readyTeams = teams.filter((t) => t.status === "READY").length;
  const completeTeams = teams.filter((t) => t.status === "COMPLETE").length;
  const incompleteTeams = teams.filter((t) => t.status === "INCOMPLETE").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mx-auto" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🏏</span>
          </div>
          <p className="mt-4 text-slate-400 font-medium">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
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
              Track cricket teams, pickleball entries, and tournament progress in real-time
            </p>
            <Countdown targetDate={startDate} />
          </div>
        </div>
      </div>

      {/* Stats Cards - overlapping the hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <StatsCards
          totalTeams={teams.length}
          readyTeams={readyTeams}
          completeTeams={completeTeams}
          incompleteTeams={incompleteTeams}
          poolCount={pool.length}
          tvMode={tvMode}
        />
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, players, captains..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-brand-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent shadow-sm placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
            <h2 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-xl"}`}>
              Teams
            </h2>
            <span className="text-sm text-slate-400 font-medium">
              ({filteredTeams.length}{search ? ` of ${teams.length}` : ""})
            </span>
          </div>
          <TeamCards teams={filteredTeams} tvMode={tvMode} />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-violet-400 to-violet-600 rounded-full" />
            <h2 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-xl"}`}>
              Player Pool
            </h2>
            <span className="text-sm text-slate-400 font-medium">
              ({filteredPool.length}{search ? ` of ${pool.length}` : ""})
            </span>
          </div>
          <PoolTable players={filteredPool} tvMode={tvMode} />
        </div>

        {/* Pickleball Section */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
            <h2 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-xl"}`}>
              Pickleball Tournament
            </h2>
            <span className="text-sm text-slate-400 font-medium">
              ({pickleballRegs.length})
            </span>
          </div>
          <PickleballDashboard registrations={pickleballRegs} />
        </div>
      </div>
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
