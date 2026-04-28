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
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [pendingPool, setPendingPool] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [regCloseDate, setRegCloseDate] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [venueMapUrl, setVenueMapUrl] = useState("");

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
      if (teamsData && Array.isArray(teamsData.teams)) {
        setTeams(teamsData.teams);
        setPendingTeams(teamsData.pendingTeams || []);
      } else if (Array.isArray(teamsData)) {
        setTeams(teamsData);
      }
      if (poolData && Array.isArray(poolData.players)) {
        setPool(poolData.players);
        setPendingPool(poolData.pendingPlayers || []);
      } else if (Array.isArray(poolData)) {
        setPool(poolData);
      }
      setStartDate(settingsData?.cricketStartDate || settingsData?.tournamentStartDate || null);
      setRegCloseDate(settingsData?.cricketRegCloseDate || null);
      setVenue(settingsData?.cricketVenue || "");
      setVenueMapUrl(settingsData?.cricketVenueMapUrl || "");
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

  const filteredPendingTeams = q
    ? pendingTeams.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.captainName?.toLowerCase().includes(q) ||
        t.players.some((p) => p.fullName.toLowerCase().includes(q))
      )
    : pendingTeams;

  const filteredPendingPool = q
    ? pendingPool.filter((p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.preferredRole.toLowerCase().includes(q)
      )
    : pendingPool;

  const readyTeams = teams.filter((t) => t.status === "READY").length;
  const completeTeams = teams.filter((t) => t.status === "COMPLETE").length;
  const incompleteTeams = teams.filter((t) => t.status === "INCOMPLETE").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-pitch-500 mx-auto" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🏏</span>
          </div>
          <p className="mt-4 text-slate-500 font-medium">Loading cricket data...</p>
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

      {/* Venue */}
      {venue && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-dark-400/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-pitch-500/[0.07] via-transparent to-pitch-500/[0.07]" />
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pitch-400 via-pitch-500 to-pitch-600 rounded-l-2xl" />
            <div className="relative flex items-center gap-4 px-6 py-4">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-pitch-500/15 border border-pitch-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-pitch-500 rounded-full border-2 border-dark-400 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-1">Match Venue</p>
                <p className="text-[15px] font-bold text-white leading-tight">{venue}</p>
              </div>
              {venueMapUrl && (
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pitch-500/10 hover:bg-pitch-500/20 border border-pitch-500/20 hover:border-pitch-500/40 text-pitch-300 hover:text-pitch-200 text-xs font-bold transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Get Directions
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration closing banner */}
      {regCloseDate && new Date(regCloseDate).getTime() > Date.now() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-lg">⏰</span>
            <p className="text-amber-400">
              <span className="font-bold">Register soon!</span>{" "}
              Cricket registration closes by{" "}
              <span className="font-bold">{new Date(regCloseDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          </div>
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
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, players, captains..."
            className="w-full pl-12 pr-4 py-3 bg-dark-400/60 border border-white/[0.06] rounded-2xl text-sm text-white focus:ring-2 focus:ring-pitch-500/50 focus:border-pitch-500/30 shadow-sm placeholder:text-slate-500 backdrop-blur-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
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
            <h2 className={`font-bold text-white ${tvMode ? "text-tv-xl" : "text-xl"}`}>Teams</h2>
            <span className="text-sm text-slate-500 font-medium">
              ({filteredTeams.length}{search ? ` of ${teams.length}` : ""})
            </span>
          </div>
          <TeamCards teams={filteredTeams} tvMode={tvMode} />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-gradient-to-b from-violet-400 to-violet-600 rounded-full" />
            <h2 className={`font-bold text-white ${tvMode ? "text-tv-xl" : "text-xl"}`}>Player Pool</h2>
            <span className="text-sm text-slate-500 font-medium">
              ({filteredPool.length}{search ? ` of ${pool.length}` : ""})
            </span>
          </div>
          <PoolTable players={filteredPool} tvMode={tvMode} />
        </div>

        {/* Pending Approval Section */}
        {(filteredPendingTeams.length > 0 || filteredPendingPool.length > 0) && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className={`font-bold text-white ${tvMode ? "text-tv-xl" : "text-xl"}`}>Awaiting Approval</h2>
              <span className="text-sm text-slate-500 font-medium">
                ({filteredPendingTeams.length + filteredPendingPool.length})
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-5 ml-4">
              These registrations are pending admin review and will move to the sections above once approved.
            </p>

            {filteredPendingTeams.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 ml-1">Pending Teams ({filteredPendingTeams.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPendingTeams.map((team) => (
                    <div
                      key={team.id}
                      className="text-left bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-2xl p-5 opacity-75"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {team.color && (
                            <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10 shadow-sm" style={{ background: team.color }} />
                          )}
                          <h3 className="text-lg font-extrabold text-slate-300 leading-tight">
                            {team.name}
                          </h3>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          PENDING APPROVAL
                        </span>
                      </div>
                      {(team.captainName || team.captain) && (
                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <span>👤</span> {team.captainName || team.captain?.displayName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">{team.memberCount} player{team.memberCount !== 1 ? "s" : ""} registered</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPendingPool.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-3 ml-1">Pending Individuals ({filteredPendingPool.length})</h3>
                <div className="bg-amber-500/5 rounded-2xl border-2 border-dashed border-amber-500/20 overflow-hidden opacity-75">
                  <div className="px-2">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-500/10">
                          <th className="text-left py-3 px-4 text-xs font-bold text-amber-400 uppercase tracking-widest">Name</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-amber-400 uppercase tracking-widest">Role</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-amber-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPendingPool.map((player, idx) => (
                          <tr key={player.id} className={idx !== filteredPendingPool.length - 1 ? "border-b border-amber-500/5" : ""}>
                            <td className="py-3 px-4 text-sm font-semibold text-slate-300">{player.fullName}</td>
                            <td className="py-3 px-4 text-sm text-slate-400">{player.preferredRole || "—"}</td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                PENDING
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
