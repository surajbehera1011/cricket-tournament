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

interface PbReg {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
}

const PB_CATEGORIES = [
  { key: "MENS_SINGLES", label: "Men's Singles", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", accent: "bg-sky-500" },
  { key: "WOMENS_SINGLES", label: "Women's Singles", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", accent: "bg-pink-500" },
  { key: "MENS_DOUBLES", label: "Men's Doubles", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", accent: "bg-blue-500" },
  { key: "WOMENS_DOUBLES", label: "Women's Doubles", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", accent: "bg-fuchsia-500" },
  { key: "MIXED_DOUBLES", label: "Mixed Doubles", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", accent: "bg-violet-500" },
];

type Sport = "cricket" | "pickleball";

export default function SchedulePage() {
  const [sport, setSport] = useState<Sport>("cricket");
  const [teams, setTeams] = useState<Team[]>([]);
  const [pbRegs, setPbRegs] = useState<PbReg[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [teamsRes, pbRes] = await Promise.all([
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pickleball?_t=${ts}`, { cache: "no-store" }),
      ]);
      const teamsData = await teamsRes.json();
      const pbData = await pbRes.json();
      const teamsList = teamsData.teams ?? teamsData;
      if (Array.isArray(teamsList)) setTeams(teamsList);
      if (Array.isArray(pbData)) setPbRegs(pbData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const readyTeams = teams.filter((t) => t.status === "READY");

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

  const generatePbFixtures = (entries: PbReg[]) => {
    const fixtures: { id: string; entry1: PbReg; entry2: PbReg; matchNumber: number; round: number }[] = [];
    let matchNum = 1;
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        fixtures.push({
          id: `${entries[i].id}-${entries[j].id}`,
          entry1: entries[i],
          entry2: entries[j],
          matchNumber: matchNum,
          round: Math.ceil(matchNum / Math.max(1, Math.floor(entries.length / 2))),
        });
        matchNum++;
      }
    }
    return fixtures;
  };

  const entryName = (reg: PbReg) => {
    if (reg.player2Name) return `${reg.player1Name} & ${reg.player2Name}`;
    return reg.player1Name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-pitch-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Match Schedule & Fixtures</h1>
        <p className="mt-1 text-slate-500">Tournament fixtures and match-ups</p>
      </div>

      {/* Sport Selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex gap-1 bg-dark-400/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.06] shadow-xl shadow-black/20">
          <button
            onClick={() => setSport("cricket")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${sport === "cricket" ? "bg-pitch-500 text-white shadow-lg shadow-pitch-500/25" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}
          >
            🏏 Cricket
          </button>
          <button
            onClick={() => setSport("pickleball")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${sport === "pickleball" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}
          >
            🏓 Pickleball
          </button>
        </div>
      </div>

      {/* Cricket Schedule */}
      {sport === "cricket" && (
        <div>
          {readyTeams.length < 2 ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
              <span className="text-4xl mb-3 block">🏏</span>
              <h2 className="text-xl font-bold text-amber-400 mb-2">Cricket Schedule Not Available Yet</h2>
              <p className="text-sm text-amber-400/70 max-w-md mx-auto">
                The match schedule will be generated once all teams are finalized and marked as <strong>READY</strong> by the admin.
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                <div className="dark-card rounded-xl px-4 py-2">
                  <span className="font-bold text-pitch-400">{readyTeams.length}</span>
                  <span className="text-slate-400 ml-1">Ready</span>
                </div>
                <div className="dark-card rounded-xl px-4 py-2">
                  <span className="font-bold text-amber-400">{teams.length - readyTeams.length}</span>
                  <span className="text-slate-400 ml-1">Pending</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-brand-400 flex items-center gap-2">
                <span>📅</span>
                <span><strong>{schedule.length}</strong> matches across <strong>{Object.keys(rounds).length}</strong> round(s) &middot; <strong>{readyTeams.length}</strong> teams</span>
              </div>
              <div className="space-y-8">
                {Object.entries(rounds).map(([round, matches]) => (
                  <div key={round}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
                      <h3 className="text-lg font-bold text-white">Round {round}</h3>
                      <span className="text-sm text-slate-500 font-medium">({matches.length} matches)</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {matches.map((match) => (
                        <div key={match.id} className="dark-card rounded-2xl p-4 hover:border-white/[0.12] transition-all">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Match #{match.matchNumber}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: match.team1.color || "#6366f1" }}>
                                {match.team1.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-tight">{match.team1.name}</p>
                                <p className="text-[10px] text-slate-500">{match.team1.captainName}</p>
                              </div>
                            </div>
                            <div className="mx-3 px-3 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-extrabold flex-shrink-0">VS</div>
                            <div className="flex items-center gap-2 flex-1 justify-end text-right">
                              <div>
                                <p className="text-sm font-bold text-white leading-tight">{match.team2.name}</p>
                                <p className="text-[10px] text-slate-500">{match.team2.captainName}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: match.team2.color || "#8b5cf6" }}>
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
        </div>
      )}

      {/* Pickleball Fixtures */}
      {sport === "pickleball" && (
        <div className="space-y-10">
          {pbRegs.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
              <span className="text-4xl mb-3 block">🏓</span>
              <h2 className="text-xl font-bold text-amber-400 mb-2">Pickleball Fixtures Not Available Yet</h2>
              <p className="text-sm text-amber-400/70 max-w-md mx-auto">
                Fixtures will be generated once registrations are approved by the admin.
              </p>
            </div>
          ) : (
            PB_CATEGORIES.map((cat) => {
              const entries = pbRegs.filter((r) => r.category === cat.key);
              if (entries.length < 2) {
                if (entries.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-1 h-6 rounded-full ${cat.accent}`} />
                      <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                      <span className="text-sm text-slate-500 font-medium">({entries.length} entry - need at least 2)</span>
                    </div>
                    <p className={`text-sm ${cat.color} ${cat.bg} ${cat.border} border rounded-xl px-4 py-3`}>
                      Waiting for more registrations to generate fixtures.
                    </p>
                  </div>
                );
              }
              const fixtures = generatePbFixtures(entries);
              const isSingles = cat.key.includes("SINGLES");
              return (
                <div key={cat.key}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-1 h-6 rounded-full ${cat.accent}`} />
                    <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.color} ${cat.border} border`}>
                      {fixtures.length} matches
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 ml-4">{entries.length} {isSingles ? "players" : "pairs"} &middot; Round-robin format</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fixtures.map((f) => (
                      <div key={f.id} className={`dark-card rounded-2xl border ${cat.border} p-4 hover:border-white/10 transition-all`}>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                          Match #{f.matchNumber}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                              {f.entry1.player1Name.charAt(0)}
                            </div>
                            <p className="text-sm font-bold text-white truncate">{entryName(f.entry1)}</p>
                          </div>
                          <div className={`mx-2 px-2.5 py-1 rounded-lg ${cat.bg} ${cat.color} text-xs font-extrabold flex-shrink-0`}>
                            VS
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                            <p className="text-sm font-bold text-white truncate text-right">{entryName(f.entry2)}</p>
                            <div className={`w-8 h-8 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                              {f.entry2.player1Name.charAt(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      )}
    </div>
  );
}
