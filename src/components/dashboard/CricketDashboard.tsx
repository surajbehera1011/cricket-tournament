"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TeamCards } from "@/components/dashboard/TeamCards";
import { PoolTable } from "@/components/dashboard/PoolTable";
import { Countdown } from "@/components/dashboard/Countdown";
import { useSSE } from "@/lib/useSSE";

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

interface CricketDashboardProps {
  tvMode?: boolean;
}

export function CricketDashboard({ tvMode = false }: CricketDashboardProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [teamsRes, poolRes, settingsRes] = await Promise.all([
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pool?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/settings?_t=${ts}`, { cache: "no-store" }),
      ]);
      const teamsData = await teamsRes.json();
      const poolData = await poolRes.json();
      const settingsData = await settingsRes.json();
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(poolData)) setPool(poolData);
      if (settingsData?.tournamentStartDate) setStartDate(settingsData.tournamentStartDate);
    } catch (err) {
      console.error("Failed to fetch cricket data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mx-auto" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🏏</span>
          </div>
          <p className="mt-4 text-slate-400 font-medium">Loading cricket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Countdown */}
      {startDate && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-center">
          <Countdown targetDate={startDate} />
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <StatsCards
          totalTeams={teams.length}
          readyTeams={readyTeams}
          completeTeams={completeTeams}
          incompleteTeams={incompleteTeams}
          poolCount={pool.length}
          tvMode={tvMode}
        />
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
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
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Teams & Pool */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
            <h2 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-xl"}`}>Teams</h2>
            <span className="text-sm text-slate-400 font-medium">
              ({filteredTeams.length}{search ? ` of ${teams.length}` : ""})
            </span>
          </div>
          <TeamCards teams={filteredTeams} tvMode={tvMode} />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-violet-400 to-violet-600 rounded-full" />
            <h2 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-xl"}`}>Player Pool</h2>
            <span className="text-sm text-slate-400 font-medium">
              ({filteredPool.length}{search ? ` of ${pool.length}` : ""})
            </span>
          </div>
          <PoolTable players={filteredPool} tvMode={tvMode} />
        </div>
      </div>
    </div>
  );
}
