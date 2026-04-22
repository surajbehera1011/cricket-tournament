"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TeamSelector } from "@/components/dashboard/TeamSelector";
import { RosterList } from "@/components/dashboard/RosterList";
import { PoolTable } from "@/components/dashboard/PoolTable";
import { useSSE } from "@/lib/useSSE";
import { Suspense } from "react";

interface Team {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  teamSize: number;
  slotsRemaining: number;
  captain: { displayName: string } | null;
  players: {
    id: string;
    fullName: string;
    preferredRole: string;
    membershipType: string;
    positionSlot: string | null;
  }[];
}

interface PoolPlayer {
  id: string;
  fullName: string;
  preferredRole: string;
  experienceLevel: string;
  comments: string | null;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tvMode = searchParams.get("tv") === "true";

  const [teams, setTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tvCycleIdx, setTvCycleIdx] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, poolRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/pool"),
      ]);
      const teamsData = await teamsRes.json();
      const poolData = await poolRes.json();
      setTeams(teamsData);
      setPool(poolData);
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

  // TV mode: auto-cycle through teams every 10 seconds
  useEffect(() => {
    if (!tvMode || teams.length === 0) return;
    const interval = setInterval(() => {
      setTvCycleIdx((prev) => (prev + 1) % teams.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [tvMode, teams.length]);

  useEffect(() => {
    if (tvMode && teams.length > 0) {
      setSelectedTeamId(teams[tvCycleIdx]?.id ?? null);
    }
  }, [tvMode, tvCycleIdx, teams]);

  const completeTeams = teams.filter((t) => t.status === "COMPLETE").length;
  const incompleteTeams = teams.filter((t) => t.status === "INCOMPLETE").length;
  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${tvMode ? "py-8" : "py-6"}`}>
      {tvMode && (
        <div className="text-center mb-8">
          <h1 className="text-tv-3xl font-bold text-gray-900">Office Cricket Tournament</h1>
          <p className="text-tv-base text-gray-500 mt-2">Live Dashboard</p>
        </div>
      )}

      <div className="space-y-6">
        <StatsCards
          totalTeams={teams.length}
          completeTeams={completeTeams}
          incompleteTeams={incompleteTeams}
          poolCount={pool.length}
          tvMode={tvMode}
        />

        <div>
          <h2 className={`font-semibold text-gray-900 mb-3 ${tvMode ? "text-tv-xl" : "text-lg"}`}>
            Teams
          </h2>
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelect={setSelectedTeamId}
            tvMode={tvMode}
          />
        </div>

        {selectedTeam ? (
          <RosterList team={selectedTeam} tvMode={tvMode} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <RosterList key={team.id} team={team} tvMode={tvMode} />
            ))}
          </div>
        )}

        <PoolTable players={pool} tvMode={tvMode} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-600 mx-auto" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
