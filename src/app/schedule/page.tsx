"use client";

import { useState, useEffect, useCallback } from "react";

interface Team {
  id: string;
  name: string;
  status: string;
  color?: string;
  captainName: string;
  memberCount: number;
  teamSize: number;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  round: number;
  matchNumber: number;
}

export default function SchedulePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/teams?_t=${ts}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const readyTeams = teams.filter((t) => t.status === "READY");
  const allReady = teams.length > 0 && readyTeams.length === teams.length;

  const generateRoundRobin = (teamList: Team[]): Match[] => {
    const matches: Match[] = [];
    let matchNum = 1;
    for (let i = 0; i < teamList.length; i++) {
      for (let j = i + 1; j < teamList.length; j++) {
        matches.push({
          id: `${i}-${j}`,
          team1: teamList[i],
          team2: teamList[j],
          round: Math.ceil(matchNum / Math.floor(teamList.length / 2)),
          matchNumber: matchNum,
        });
        matchNum++;
      }
    }
    return matches;
  };

  const schedule = readyTeams.length >= 2 ? generateRoundRobin(readyTeams) : [];

  const rounds = schedule.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Match Schedule</h1>
        <p className="mt-1 text-slate-500">Tournament fixtures and match-ups</p>
      </div>

      {/* Status Banner */}
      {!allReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center">
          <span className="text-4xl mb-3 block">🏏</span>
          <h2 className="text-xl font-bold text-amber-800 mb-2">Schedule Not Available Yet</h2>
          <p className="text-sm text-amber-600 max-w-md mx-auto">
            The match schedule will be generated once all teams are finalized and marked as <strong>READY</strong> by the admin.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <div className="bg-white rounded-xl px-4 py-2 border border-amber-200">
              <span className="font-bold text-emerald-600">{readyTeams.length}</span>
              <span className="text-amber-700 ml-1">Ready</span>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 border border-amber-200">
              <span className="font-bold text-amber-600">{teams.length - readyTeams.length}</span>
              <span className="text-amber-700 ml-1">Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedule (shown when at least 2 READY) */}
      {readyTeams.length >= 2 && (
        <>
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-6 text-sm text-brand-700 flex items-center gap-2">
            <span>📅</span>
            <span><strong>{schedule.length}</strong> matches across <strong>{Object.keys(rounds).length}</strong> round(s) &middot; <strong>{readyTeams.length}</strong> teams</span>
          </div>

          <div className="space-y-8">
            {Object.entries(rounds).map(([round, matches]) => (
              <div key={round}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
                  <h3 className="text-lg font-bold text-slate-800">Round {round}</h3>
                  <span className="text-sm text-slate-400 font-medium">({matches.length} matches)</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="bg-white rounded-2xl border border-brand-100/50 p-4 hover:shadow-md transition-all"
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Match #{match.matchNumber}
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Team 1 */}
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: match.team1.color || "#6366f1" }}
                          >
                            {match.team1.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{match.team1.name}</p>
                            <p className="text-[10px] text-slate-400">{match.team1.captainName}</p>
                          </div>
                        </div>

                        {/* VS */}
                        <div className="mx-3 px-3 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs font-extrabold flex-shrink-0">
                          VS
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center gap-2 flex-1 justify-end text-right">
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{match.team2.name}</p>
                            <p className="text-[10px] text-slate-400">{match.team2.captainName}</p>
                          </div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: match.team2.color || "#8b5cf6" }}
                          >
                            {match.team2.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {readyTeams.length < 2 && allReady && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🏏</span>
          <p className="text-slate-400 font-medium">Need at least 2 ready teams to generate a schedule</p>
        </div>
      )}
    </div>
  );
}
