"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TeamCards } from "@/components/dashboard/TeamCards";
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
  femaleCount: number;
  captainName: string;
  captain: { displayName: string } | null;
  players: {
    id: string;
    fullName: string;
    preferredRole: string;
    gender?: string;
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

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [teamsRes, poolRes] = await Promise.all([
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pool?_t=${ts}`, { cache: "no-store" }),
      ]);
      const teamsData = await teamsRes.json();
      const poolData = await poolRes.json();
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(poolData)) setPool(poolData);
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

  const readyTeams = teams.filter((t) => t.status === "READY").length;
  const completeTeams = teams.filter((t) => t.status === "COMPLETE").length;
  const incompleteTeams = teams.filter((t) => t.status === "INCOMPLETE").length;

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
          readyTeams={readyTeams}
          completeTeams={completeTeams}
          incompleteTeams={incompleteTeams}
          poolCount={pool.length}
          tvMode={tvMode}
        />

        <div>
          <h2 className={`font-semibold text-gray-900 mb-4 ${tvMode ? "text-tv-xl" : "text-lg"}`}>
            Teams
          </h2>
          <TeamCards teams={teams} tvMode={tvMode} />
        </div>

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
