"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Team { id: string; name: string; color?: string; captainName: string; status: string; }
interface PbReg { id: string; category: string; player1Name: string; player2Name: string | null; }
interface MatchData { id: string; stage: string; groupName: string | null; roundNumber: number; matchNumber: number; category: string | null; team1Id: string | null; team2Id: string | null; entry1Id: string | null; entry2Id: string | null; score1: string | null; score2: string | null; winnerId: string | null; status: string; scheduledDate: string | null; venue: string | null; }
interface Settings { targetCricketTeams: number; cricketGroupCount: number; }

type Sport = "cricket" | "pickleball";
const GROUP_COLORS: Record<string, string> = { A: "#3b82f6", B: "#a855f7", C: "#f59e0b", D: "#10b981", E: "#ec4899", F: "#06b6d4", G: "#f43f5e", H: "#84cc16" };
const PB_CATS = [
  { key: "MENS_SINGLES", label: "Men's Singles", color: "text-sky-400", bg: "bg-sky-500/10", accent: "#0ea5e9" },
  { key: "WOMENS_SINGLES", label: "Women's Singles", color: "text-pink-400", bg: "bg-pink-500/10", accent: "#ec4899" },
  { key: "MENS_DOUBLES", label: "Men's Doubles", color: "text-blue-400", bg: "bg-blue-500/10", accent: "#3b82f6" },
  { key: "WOMENS_DOUBLES", label: "Women's Doubles", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", accent: "#d946ef" },
  { key: "MIXED_DOUBLES", label: "Mixed Doubles", color: "text-violet-400", bg: "bg-violet-500/10", accent: "#8b5cf6" },
];

function nextPow2(n: number) { let p = 1; while (p < n) p <<= 1; return Math.max(p, 4); }

function genCricketGroups(teams: Team[], target: number, groupCount: number) {
  const perGroup = Math.ceil(target / groupCount);
  const groups: { name: string; members: (Team | null)[] }[] = [];
  for (let g = 0; g < groupCount; g++) {
    const label = String.fromCharCode(65 + g);
    const members: (Team | null)[] = [];
    for (let s = 0; s < perGroup; s++) {
      const idx = g * perGroup + s;
      members.push(idx < teams.length ? teams[idx] : null);
    }
    groups.push({ name: label, members });
  }
  return groups;
}

function genGroupMatches(groups: { name: string; members: (Team | null)[] }[]) {
  const matches: MatchData[] = [];
  let num = 1;
  for (const g of groups) {
    let round = 1;
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        matches.push({ id: `g-${num}`, stage: "GROUP", groupName: g.name, roundNumber: round, matchNumber: num, category: null, team1Id: g.members[i]?.id ?? null, team2Id: g.members[j]?.id ?? null, entry1Id: null, entry2Id: null, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
        num++;
        if (num % Math.max(1, Math.floor(g.members.length / 2)) === 0) round++;
      }
    }
  }
  return { matches, nextNum: num };
}

function genCricketKnockout(groups: { name: string }[], startNum: number) {
  const matches: MatchData[] = [];
  let num = startNum;
  if (groups.length === 4) {
    matches.push({ id: `ko-${num}`, stage: "KNOCKOUT", groupName: null, roundNumber: 1, matchNumber: num, category: null, team1Id: "WINNER_A", team2Id: "WINNER_B", entry1Id: null, entry2Id: null, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
    num++;
    matches.push({ id: `ko-${num}`, stage: "KNOCKOUT", groupName: null, roundNumber: 1, matchNumber: num, category: null, team1Id: "WINNER_C", team2Id: "WINNER_D", entry1Id: null, entry2Id: null, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
    num++;
    matches.push({ id: `ko-${num}`, stage: "KNOCKOUT", groupName: null, roundNumber: 2, matchNumber: num, category: null, team1Id: "WINNER_SF1", team2Id: "WINNER_SF2", entry1Id: null, entry2Id: null, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
  } else if (groups.length === 2) {
    matches.push({ id: `ko-${num}`, stage: "KNOCKOUT", groupName: null, roundNumber: 1, matchNumber: num, category: null, team1Id: "WINNER_A", team2Id: "WINNER_B", entry1Id: null, entry2Id: null, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
  }
  return matches;
}

function seedOrderClient(size: number): number[] {
  if (size === 1) return [0];
  const half = seedOrderClient(size / 2);
  const result: number[] = [];
  for (const h of half) { result.push(h); result.push(size - 1 - h); }
  return result;
}

function genPbBracket(entries: PbReg[], cat: string, startNum: number) {
  const size = nextPow2(Math.max(entries.length, 2));
  const slots: (string | null)[] = new Array(size).fill(null);
  const order = seedOrderClient(size);
  for (let i = 0; i < entries.length; i++) slots[order[i]] = entries[i].id;
  const matches: MatchData[] = [];
  let num = startNum;
  let current = slots;
  let round = 1;
  while (current.length > 1) {
    const next: (string | null)[] = [];
    let roundHasMatches = false;
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i], b = current[i + 1];
      if (a && !b) { next.push(a); continue; }
      if (!a && b) { next.push(b); continue; }
      if (!a && !b) { next.push(null); continue; }
      roundHasMatches = true;
      matches.push({ id: `pb-${num}`, stage: "KNOCKOUT", groupName: null, roundNumber: round, matchNumber: num, category: cat, team1Id: null, team2Id: null, entry1Id: a, entry2Id: b, score1: null, score2: null, winnerId: null, status: "SCHEDULED", scheduledDate: null, venue: null });
      next.push(`W${num}`);
      num++;
    }
    if (roundHasMatches) round++;
    current = next;
  }
  return { matches, nextNum: num };
}

export default function SchedulePage() {
  const [sport, setSport] = useState<Sport>("pickleball");
  const [teams, setTeams] = useState<Team[]>([]);
  const [pbRegs, setPbRegs] = useState<PbReg[]>([]);
  const [settings, setSettings] = useState<Settings>({ targetCricketTeams: 12, cricketGroupCount: 4 });
  const [frozenCricket, setFrozenCricket] = useState<MatchData[] | null>(null);
  const [frozenPb, setFrozenPb] = useState<MatchData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const cricketRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, pRes, sRes, fcRes, fpRes] = await Promise.all([
        fetch("/api/teams"), fetch("/api/pickleball"), fetch("/api/settings"),
        fetch("/api/fixtures?sport=CRICKET"), fetch("/api/fixtures?sport=PICKLEBALL"),
      ]);
      const tData = await tRes.json(); const pData = await pRes.json(); const sData = await sRes.json();
      const fcData = await fcRes.json(); const fpData = await fpRes.json();
      const list = tData.teams ?? tData;
      if (Array.isArray(list)) setTeams(list.filter((t: Team) => t.status === "READY"));
      const pbList = pData.registrations ?? (Array.isArray(pData) ? pData : []);
      setPbRegs(pbList);
      setSettings({ targetCricketTeams: sData.targetCricketTeams ?? 12, cricketGroupCount: sData.cricketGroupCount ?? 4 });
      if (fcData.frozen && fcData.fixture) setFrozenCricket(fcData.fixture.matches);
      else setFrozenCricket(null);
      if (fpData.frozen && fpData.fixture) setFrozenPb(fpData.fixture.matches);
      else setFrozenPb(null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const readyTeams = teams;
  const groups = genCricketGroups(readyTeams, settings.targetCricketTeams, settings.cricketGroupCount);
  const { matches: groupMatches, nextNum } = genGroupMatches(groups);
  const knockoutMatches = genCricketKnockout(groups, nextNum);
  const cricketMatches = frozenCricket ?? [...groupMatches, ...knockoutMatches];
  const cGroups = [...new Set(cricketMatches.filter(m => m.stage === "GROUP").map(m => m.groupName))].sort();
  const cKnockout = cricketMatches.filter(m => m.stage === "KNOCKOUT");

  const pbMatchesByCategory: Record<string, MatchData[]> = {};
  if (frozenPb) {
    for (const m of frozenPb) { const c = m.category || ""; if (!pbMatchesByCategory[c]) pbMatchesByCategory[c] = []; pbMatchesByCategory[c].push(m); }
  } else {
    for (const cat of PB_CATS) {
      const entries = pbRegs.filter(r => r.category === cat.key);
      const { matches } = genPbBracket(entries, cat.key, 1);
      pbMatchesByCategory[cat.key] = matches;
    }
  }

  const getTeam = (id: string | null) => { if (!id) return null; return readyTeams.find(t => t.id === id) ?? null; };
  const teamLabel = (id: string | null) => { if (!id) return "Your Team?"; if (id.startsWith("WINNER_") || id.startsWith("RUNNER_")) return id.replace(/_/g, " "); const t = getTeam(id); return t?.name ?? "Your Team?"; };
  const teamColor = (id: string | null) => getTeam(id)?.color;
  const isTbd = (id: string | null) => !id || id.startsWith("WINNER_") || id.startsWith("RUNNER_") || !getTeam(id);
  const entryLabel = (id: string | null) => { if (!id || id.startsWith("W")) return "Register Now!"; const r = pbRegs.find(r => r.id === id); if (!r) return "Register Now!"; return r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name; };
  const isEntryTbd = (id: string | null) => !id || id.startsWith("W") || !pbRegs.find(r => r.id === id);
  const pct = Math.min(100, Math.round((readyTeams.length / settings.targetCricketTeams) * 100));

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-indigo-500" /></div>);

  return (
    <div className="min-h-screen">
      <HeroSection sport={sport} setSport={setSport} />
      {sport === "pickleball" ? (
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <PbBrackets matchesByCategory={pbMatchesByCategory} entryLabel={entryLabel} isEntryTbd={isEntryTbd} pbRegs={pbRegs} />
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-10">
          <div className="flex items-center justify-between">
            <div />
            <PrintButton targetRef={cricketRef} title="Cricket Schedule" subtitle="Group Stage & Knockout Fixtures" />
          </div>
          <div ref={cricketRef}>
          <ProgressBar current={readyTeams.length} total={settings.targetCricketTeams} pct={pct} />
          <div className="mt-10"><GroupStage groups={cGroups} matches={cricketMatches} teamLabel={teamLabel} teamColor={teamColor} isTbd={isTbd} /></div>
          <div className="mt-10"><KnockoutStage matches={cKnockout} teamLabel={teamLabel} teamColor={teamColor} isTbd={isTbd} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSection({ sport, setSport }: { sport: Sport; setSport: (s: Sport) => void }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-900 border-b border-white/[0.04]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/[0.08] animate-pulse" style={{ left: `${5 + (i * 47) % 90}%`, top: `${10 + (i * 31) % 80}%`, animationDelay: `${i * 0.3}s`, animationDuration: `${2 + (i % 3)}s` }} />
        ))}
      </div>
      <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-[0.2em] uppercase mb-2">Align Sports League</h1>
        <p className="text-sm md:text-base text-slate-400 tracking-widest uppercase mb-8">Tournament Fixtures &amp; Brackets &bull; 2026</p>
        <div className="inline-flex gap-1.5 bg-dark-400/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.06] shadow-xl">
          <button onClick={() => setSport("pickleball")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${sport === "pickleball" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}>
            Pickleball
          </button>
          <button onClick={() => setSport("cricket")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${sport === "cricket" ? "bg-pitch-500 text-white shadow-lg shadow-pitch-500/30" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}>
            Cricket
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total, pct }: { current: number; total: number; pct: number }) {
  const full = current >= total;
  return (
    <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur border border-white/[0.06] p-5" style={{ animation: "fadeIn 0.5s ease-out" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-white">{full ? "All Slots Filled!" : "Team Registration Progress"}</span>
        <span className={`text-sm font-bold ${full ? "text-emerald-400" : "text-indigo-400"}`}>{current} / {total} teams</span>
      </div>
      <div className="h-3 rounded-full bg-dark-500 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${full ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_16px_rgba(99,102,241,0.3)]"}`} style={{ width: `${pct}%` }} />
      </div>
      {!full && <p className="text-xs text-slate-500 mt-2">Spots are filling up! <Link href="/register?sport=cricket" className="text-indigo-400 hover:text-indigo-300 font-medium">Register your team</Link></p>}
    </div>
  );
}

function GroupStage({ groups, matches, teamLabel, teamColor, isTbd }: { groups: (string | null)[]; matches: MatchData[]; teamLabel: (id: string | null) => string; teamColor: (id: string | null) => string | undefined; isTbd: (id: string | null) => boolean }) {
  if (groups.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 to-purple-500" />
        <h2 className="text-2xl font-black text-white tracking-tight">Group Stage</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((g, gi) => {
          const gm = matches.filter(m => m.stage === "GROUP" && m.groupName === g);
          const accent = GROUP_COLORS[g || "A"] || "#6366f1";
          const standings = calcStandings(gm, true);
          return (
            <div key={g} className="rounded-2xl bg-white/[0.03] backdrop-blur border border-white/[0.06] overflow-hidden" style={{ animation: `fadeIn 0.5s ease-out ${gi * 0.1}s both` }}>
              <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `2px solid ${accent}20`, background: `linear-gradient(135deg, ${accent}08, transparent)` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: accent }}>{g}</div>
                <h3 className="text-sm font-bold text-white">Group {g} <span className="text-[10px] text-slate-500 ml-1">{gm.length} matches</span></h3>
              </div>
              {/* Standings Table */}
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="text-left py-1 font-semibold">Team</th>
                      <th className="text-center w-8 font-semibold">P</th>
                      <th className="text-center w-8 font-semibold">W</th>
                      <th className="text-center w-8 font-semibold">L</th>
                      <th className="text-center w-10 font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, si) => (
                      <tr key={s.id} className={si === 0 && s.played > 0 ? "text-emerald-400" : "text-slate-300"}>
                        <td className="py-1 flex items-center gap-2">
                          {!isTbd(s.id) && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: teamColor(s.id) || accent }}>{teamLabel(s.id).charAt(0)}</div>}
                          <span className="font-medium truncate">{isTbd(s.id) ? "TBD" : teamLabel(s.id)}</span>
                          {si === 0 && s.won > 0 && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">1st</span>}
                        </td>
                        <td className="text-center">{s.played}</td>
                        <td className="text-center">{s.won}</td>
                        <td className="text-center">{s.lost}</td>
                        <td className="text-center font-bold">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {gm.map(m => <MatchCard key={m.id} m={m} l1={teamLabel(m.team1Id)} l2={teamLabel(m.team2Id)} c1={teamColor(m.team1Id)} c2={teamColor(m.team2Id)} t1={isTbd(m.team1Id)} t2={isTbd(m.team2Id)} accent={accent} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calcStandings(groupMatches: MatchData[], isCricket: boolean) {
  const map = new Map<string, { id: string; played: number; won: number; lost: number; points: number }>();
  const getOrCreate = (id: string) => {
    if (!map.has(id)) map.set(id, { id, played: 0, won: 0, lost: 0, points: 0 });
    return map.get(id)!;
  };
  for (const m of groupMatches) {
    const p1 = isCricket ? m.team1Id : m.entry1Id;
    const p2 = isCricket ? m.team2Id : m.entry2Id;
    if (!p1 || !p2) continue;
    const s1 = getOrCreate(p1);
    const s2 = getOrCreate(p2);
    if (m.winnerId) {
      s1.played++; s2.played++;
      if (m.winnerId === p1) { s1.won++; s1.points += 2; s2.lost++; }
      else if (m.winnerId === p2) { s2.won++; s2.points += 2; s1.lost++; }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.points !== a.points ? b.points - a.points : b.won !== a.won ? b.won - a.won : a.lost - b.lost);
}

function KnockoutStage({ matches, teamLabel, teamColor, isTbd }: { matches: MatchData[]; teamLabel: (id: string | null) => string; teamColor: (id: string | null) => string | undefined; isTbd: (id: string | null) => boolean }) {
  if (matches.length === 0) return null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rounds = [...new Set(matches.map(m => m.roundNumber))].sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const roundMatches: MatchData[][] = rounds.map(r => matches.filter(m => m.roundNumber === r));

  const MATCH_H = 56;
  const GAP = 6;
  const CONN_W = 36;
  const TROPHY_W = 48;
  const COL_W = containerW > 0 && totalRounds > 0
    ? Math.floor((containerW - (totalRounds - 1) * CONN_W - TROPHY_W) / totalRounds)
    : 220;
  const CELL = MATCH_H + GAP;
  const accent = "#f59e0b";

  const getRoundLabel = (ri: number) => {
    const remaining = totalRounds - ri;
    if (remaining === 1) return "Final";
    if (remaining === 2) return "Semi-Finals";
    if (remaining === 3) return "Quarter-Finals";
    return `Round ${ri + 1}`;
  };

  const getMatchY = (ri: number, mi: number): number => {
    if (ri === 0) return mi * CELL;
    const child1Y = getMatchY(ri - 1, mi * 2);
    const child2Y = getMatchY(ri - 1, mi * 2 + 1);
    return (child1Y + child2Y) / 2;
  };

  const r0Count = roundMatches[0]?.length || 0;
  const totalH = Math.max(r0Count * CELL - GAP, MATCH_H);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
        <h2 className="text-2xl font-black text-white tracking-tight">Knockout Stage</h2>
      </div>

      <div ref={containerRef} className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0e14] border border-white/[0.06] p-4 md:p-6">
        {containerW > 0 && <>
        {/* Round headers */}
        <div className="flex mb-3">
          {rounds.map((_, ri) => {
            const isFinal = ri === totalRounds - 1;
            return (
              <div key={ri} style={{ width: COL_W + (ri < totalRounds - 1 ? CONN_W : 0), flexShrink: 0 }} className="text-center">
                <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${isFinal ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-white/[0.03] text-slate-500 border-white/[0.06]"}`}>
                  {getRoundLabel(ri)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bracket canvas */}
        <div className="relative" style={{ height: Math.max(totalH, MATCH_H) }}>
          {/* SVG connectors */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: "visible" }}>
            {roundMatches.map((rm, ri) => {
              if (ri === totalRounds - 1) return null;
              const x1 = ri * (COL_W + CONN_W) + COL_W;
              const x2 = x1 + CONN_W;
              const xMid = x1 + CONN_W / 2;

              return rm.map((_, mi) => {
                if (mi % 2 !== 0) return null;
                const topY = getMatchY(ri, mi) + MATCH_H / 2;
                const botY = getMatchY(ri, mi + 1) + MATCH_H / 2;
                const midY = (topY + botY) / 2;

                return (
                  <g key={`${ri}-${mi}`}>
                    <line x1={x1} y1={topY} x2={xMid} y2={topY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                    <line x1={x1} y1={botY} x2={xMid} y2={botY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                    <line x1={xMid} y1={topY} x2={xMid} y2={botY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                    <line x1={xMid} y1={midY} x2={x2} y2={midY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                    <circle cx={xMid} cy={midY} r="2.5" fill={accent} fillOpacity="0.4" />
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {roundMatches.map((rm, ri) => {
            const isFinal = ri === totalRounds - 1;
            const xOffset = ri * (COL_W + CONN_W);

            return rm.map((m, mi) => {
              const y = getMatchY(ri, mi);
              const l1 = teamLabel(m.team1Id);
              const l2 = teamLabel(m.team2Id);
              const c1 = teamColor(m.team1Id) || accent;
              const c2 = teamColor(m.team2Id) || accent;
              const t1 = isTbd(m.team1Id);
              const t2 = isTbd(m.team2Id);
              const isCompleted = m.status === "COMPLETED";
              const w1 = m.winnerId && m.winnerId === m.team1Id;
              const w2 = m.winnerId && m.winnerId === m.team2Id;

              return (
                <div key={m.id} className="absolute" style={{ left: xOffset, top: y, width: COL_W, height: MATCH_H, animation: `fadeIn 0.3s ease-out ${ri * 0.08 + mi * 0.03}s both` }}>
                  <div className={`h-full rounded-lg overflow-hidden border transition-all ${isCompleted ? "border-emerald-500/25" : isFinal ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-transparent" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}>
                    <div className={`h-[22px] flex items-center px-3 gap-2 ${w1 ? "bg-emerald-500/[0.06]" : ""}`}>
                      <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: t1 ? "rgba(55,65,81,0.5)" : c1 }}>
                        {t1 ? "?" : l1.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-[12px] font-semibold truncate flex-1 ${w1 ? "text-emerald-400" : t1 ? "text-slate-600 italic" : "text-slate-200"}`}>
                        {t1 ? "TBD" : l1}
                      </span>
                      <span className={`text-[10px] font-mono w-5 text-center ${w1 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{m.score1 ?? "-"}</span>
                    </div>

                    <div className="h-[12px] flex items-center px-3 border-y border-white/[0.04]" style={{ background: `linear-gradient(90deg, ${accent}06, transparent)` }}>
                      <span className="text-[8px] font-bold text-slate-600 tracking-wider">M{m.matchNumber}</span>
                      {isCompleted && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-1" />}
                      <div className="flex-1" />
                      {m.scheduledDate && <span className="text-[8px] text-cyan-500/70 font-medium">{new Date(m.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                    </div>

                    <div className={`h-[22px] flex items-center px-3 gap-2 ${w2 ? "bg-emerald-500/[0.06]" : ""}`}>
                      <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: t2 ? "rgba(55,65,81,0.5)" : c2 }}>
                        {t2 ? "?" : l2.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-[12px] font-semibold truncate flex-1 ${w2 ? "text-emerald-400" : t2 ? "text-slate-600 italic" : "text-slate-200"}`}>
                        {t2 ? "TBD" : l2}
                      </span>
                      <span className={`text-[10px] font-mono w-5 text-center ${w2 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{m.score2 ?? "-"}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })}

          {/* Champion trophy */}
          {totalRounds > 0 && roundMatches[totalRounds - 1]?.length === 1 && (
            <div className="absolute flex items-center gap-2" style={{ left: (totalRounds - 1) * (COL_W + CONN_W) + COL_W + 12, top: getMatchY(totalRounds - 1, 0) + MATCH_H / 2 - 14 }}>
              <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                <span className="text-xs">🏆</span>
              </div>
            </div>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}

function MatchCard({ m, l1, l2, c1, c2, t1, t2, accent, isFinal }: { m: MatchData; l1: string; l2: string; c1?: string; c2?: string; t1: boolean; t2: boolean; accent: string; isFinal?: boolean }) {
  const isCompleted = m.status === "COMPLETED";
  const w1 = m.winnerId && m.winnerId === (m.team1Id || m.entry1Id);
  const w2 = m.winnerId && m.winnerId === (m.team2Id || m.entry2Id);
  return (
    <div className={`rounded-lg overflow-hidden border transition-all duration-200 hover:border-white/[0.15] ${isCompleted ? "border-emerald-500/20" : isFinal ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)]" : "border-white/[0.08]"}`}>
      <div className={`h-[32px] flex items-center px-3 gap-2.5 ${w1 ? "bg-emerald-500/[0.06]" : t1 ? "" : "bg-white/[0.03]"}`}>
        <div className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: t1 ? "rgba(55,65,81,0.6)" : (c1 || accent) }}>
          {t1 ? "?" : l1.charAt(0).toUpperCase()}
        </div>
        <span className={`text-[13px] font-semibold truncate flex-1 ${w1 ? "text-emerald-400" : t1 ? "text-slate-600 italic" : "text-slate-200"}`}>{l1}</span>
        <span className={`text-[11px] font-mono w-6 text-center ${w1 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{m.score1 ?? "-"}</span>
      </div>
      <div className="h-[18px] flex items-center px-3 border-y border-white/[0.04]" style={{ background: `linear-gradient(90deg, ${accent}08, transparent)` }}>
        <span className="text-[9px] font-bold text-slate-600 tracking-wider">M{m.matchNumber}</span>
        {isCompleted && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        <div className="flex-1" />
        {m.scheduledDate && (
          <span className="text-[9px] text-cyan-500/80 font-medium">
            {new Date(m.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
      <div className={`h-[32px] flex items-center px-3 gap-2.5 ${w2 ? "bg-emerald-500/[0.06]" : t2 ? "" : "bg-white/[0.03]"}`}>
        <div className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: t2 ? "rgba(55,65,81,0.6)" : (c2 || accent) }}>
          {t2 ? "?" : l2.charAt(0).toUpperCase()}
        </div>
        <span className={`text-[13px] font-semibold truncate flex-1 ${w2 ? "text-emerald-400" : t2 ? "text-slate-600 italic" : "text-slate-200"}`}>{l2}</span>
        <span className={`text-[11px] font-mono w-6 text-center ${w2 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{m.score2 ?? "-"}</span>
      </div>
    </div>
  );
}

function PrintButton({ targetRef, title, subtitle }: { targetRef: React.RefObject<HTMLDivElement | null>; title: string; subtitle?: string }) {
  const [open, setOpen] = useState(false);

  const handlePrint = (theme: "dark" | "light") => {
    setOpen(false);
    if (!targetRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let allCss = "";
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) allCss += rule.cssText + "\n";
      } catch { /* cross-origin, skip */ }
    }

    const content = targetRef.current.outerHTML;

    const darkStyles = `
      body { background: #0f172a !important; color: #e2e8f0; }
      .print-header { border-bottom-color: rgba(255,255,255,0.1); }
      .print-header h1 { color: #ffffff; }
      .print-header p { color: #94a3b8; }
      [class*="bg-white\\/"] { background: rgba(255,255,255,0.03) !important; }
      [class*="bg-gradient-to-br"] { background: linear-gradient(to bottom right, #0d1117, #0a0e14) !important; }
      [class*="backdrop-blur"] { backdrop-filter: none !important; }
      [class*="bg-dark-500"], [class*="bg-dark-400"] { background: #0b0f1a !important; }
      [class*="rounded-2xl"][class*="border"] { border-color: rgba(255,255,255,0.06) !important; }
      [class*="text-white"] { color: #ffffff !important; }
      [class*="text-slate-200"] { color: #e2e8f0 !important; }
      [class*="text-slate-300"] { color: #cbd5e1 !important; }
      [class*="text-slate-400"] { color: #94a3b8 !important; }
      [class*="text-slate-500"] { color: #64748b !important; }
      [class*="text-slate-600"] { color: #475569 !important; }
      [class*="text-emerald-400"] { color: #34d399 !important; }
      [class*="text-amber-400"] { color: #fbbf24 !important; }
      [class*="text-indigo-400"] { color: #818cf8 !important; }
      [class*="text-cyan-500"] { color: #06b6d4 !important; }
      [class*="border-white"] { border-color: rgba(255,255,255,0.06) !important; }
      table { color: #e2e8f0; }
      th { color: #64748b !important; }
      h2, h3 { color: #ffffff !important; }
      svg line { stroke-opacity: 0.3 !important; }
      @media print { body { background: #0f172a !important; } }
    `;

    const lightStyles = `
      body { background: #ffffff !important; color: #1e293b; }
      .print-header { border-bottom-color: #e2e8f0; }
      .print-header h1 { color: #0f172a; }
      .print-header p { color: #64748b; }
      [class*="bg-gradient-to-br"] { background: #f8fafc !important; border-color: #e2e8f0 !important; }
      [class*="from-\\[#0d1117\\]"] { background: #f8fafc !important; }
      [class*="bg-white\\/"], [class*="bg-dark"] { background: #f8fafc !important; }
      [class*="backdrop-blur"] { backdrop-filter: none !important; }
      [class*="rounded-2xl"][class*="border"] { border-color: #e2e8f0 !important; }
      [class*="text-white"] { color: #0f172a !important; }
      [class*="text-slate-200"] { color: #1e293b !important; }
      [class*="text-slate-300"] { color: #334155 !important; }
      [class*="text-slate-400"] { color: #64748b !important; }
      [class*="text-slate-500"], [class*="text-slate-600"] { color: #64748b !important; }
      [class*="text-emerald-400"] { color: #059669 !important; }
      [class*="text-amber-400"] { color: #d97706 !important; }
      [class*="text-indigo-400"] { color: #4f46e5 !important; }
      [class*="text-cyan-500"] { color: #0891b2 !important; }
      [class*="border-white"] { border-color: #e2e8f0 !important; }
      [class*="border-emerald"] { border-color: #a7f3d0 !important; }
      [class*="border-amber"] { border-color: #fde68a !important; }
      [class*="bg-emerald"] { background: rgba(5,150,105,0.08) !important; }
      [class*="bg-amber"] { background: rgba(217,119,6,0.08) !important; }
      table { color: #1e293b; }
      th { color: #64748b !important; }
      td { color: #334155 !important; }
      h2, h3 { color: #0f172a !important; }
      svg line { stroke: #94a3b8 !important; stroke-opacity: 0.5 !important; }
      svg circle { fill: #94a3b8 !important; fill-opacity: 0.6 !important; }
      [style*="background: rgba(55,65,81"] { background: #cbd5e1 !important; }
      .h-3.rounded-full { background: #e2e8f0 !important; }
      .h-3.rounded-full > div { background: linear-gradient(to right, #3b82f6, #6366f1, #a855f7) !important; }
      @media print { body { background: #ffffff !important; } }
    `;

    const pageBreakStyles = `
      @media print {
        @page { margin: 12mm 10mm; }
        .grid { display: block !important; }
        .grid > div { break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px; }
        [class*="rounded-2xl"] { break-inside: avoid; page-break-inside: avoid; }
        [style*="position: relative"] { break-inside: avoid; page-break-inside: avoid; }
        h2, h3 { break-after: avoid; page-break-after: avoid; }
      }
    `;

    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>${allCss}</style>
<style>
  body { padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .print-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid; }
  .print-header h1 { font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .print-header p { font-size: 12px; }
  .no-print { display: none !important; }
  @media print { body { padding: 16px; } .no-print { display: none !important; } }
  ${pageBreakStyles}
  ${theme === "dark" ? darkStyles : lightStyles}
</style>
</head><body>
<div class="print-header">
  <h1>Align Sports League</h1>
  <p>${subtitle || title} &bull; 2026</p>
</div>
${content}
<script>
  setTimeout(() => { window.print(); window.close(); }, 300);
<\/script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="no-print relative">
      <button onClick={() => setOpen((p) => !p)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition-all duration-200" title={`Print ${title}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-white/[0.1] bg-[#1a1f2e] shadow-2xl overflow-hidden">
            <button onClick={() => handlePrint("light")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.08] transition-colors">
              <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex-shrink-0" />
              Light (Paper)
            </button>
            <div className="border-t border-white/[0.06]" />
            <button onClick={() => handlePrint("dark")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.08] transition-colors">
              <span className="w-5 h-5 rounded-full bg-[#0f172a] border-2 border-slate-600 flex-shrink-0" />
              Dark (Screen)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PbBrackets({ matchesByCategory, entryLabel, isEntryTbd, pbRegs }: { matchesByCategory: Record<string, MatchData[]>; entryLabel: (id: string | null) => string; isEntryTbd: (id: string | null) => boolean; pbRegs: PbReg[] }) {
  const [activeCat, setActiveCat] = useState(PB_CATS[0].key);
  const bracketRef = useRef<HTMLDivElement>(null);
  const pbContainerRef = useRef<HTMLDivElement>(null);
  const [pbContainerW, setPbContainerW] = useState(0);
  useEffect(() => {
    const el = pbContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPbContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cat = PB_CATS.find(c => c.key === activeCat)!;
  const matches = matchesByCategory[activeCat] || [];
  const rounds = [...new Set(matches.map(m => m.roundNumber))].sort((a, b) => a - b);
  const totalRounds = rounds.length;

  const getRoundLabel = (ri: number) => {
    const remaining = totalRounds - ri;
    if (remaining === 1) return "Final";
    if (remaining === 2) return "Semi-Finals";
    if (remaining === 3) return "Quarter-Finals";
    return `Round ${ri + 1}`;
  };

  const MATCH_H = 56;
  const GAP = 6;
  const CONN_W = 36;
  const TROPHY_W = 48;
  const COL_W = pbContainerW > 0 && totalRounds > 0
    ? Math.floor((pbContainerW - (totalRounds - 1) * CONN_W - TROPHY_W) / totalRounds)
    : 220;
  const CELL = MATCH_H + GAP;

  const roundMatches: MatchData[][] = rounds.map(r => matches.filter(m => m.roundNumber === r));

  const getMatchY = (ri: number, mi: number): number => {
    if (ri === 0) return mi * CELL;
    const prevCount = roundMatches[ri - 1]?.length || 0;
    const c1 = mi * 2 < prevCount ? getMatchY(ri - 1, mi * 2) : mi * CELL;
    const c2 = mi * 2 + 1 < prevCount ? getMatchY(ri - 1, mi * 2 + 1) : c1 + CELL;
    return (c1 + c2) / 2;
  };

  const r0Count = roundMatches[0]?.length || 0;
  const totalH = Math.max(r0Count * CELL - GAP, MATCH_H);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
          <h2 className="text-2xl font-black text-white tracking-tight">Pickleball Brackets</h2>
        </div>
        <PrintButton targetRef={bracketRef} title={`Pickleball — ${cat.label}`} subtitle={`${cat.label} Bracket`} />
      </div>

      <div className="flex gap-1 bg-dark-400/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 border border-white/[0.06] shadow-xl overflow-x-auto">
        {PB_CATS.map(c => {
          const count = pbRegs.filter(r => r.category === c.key).length;
          const isActive = activeCat === c.key;
          return (
            <button key={c.key} onClick={() => setActiveCat(c.key)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive ? "text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}
              style={isActive ? { background: c.accent, boxShadow: `0 8px 24px ${c.accent}30` } : {}}>
              {c.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20" : "bg-white/[0.06]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div ref={bracketRef}>
      {matches.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur border border-white/[0.06] p-16 text-center">
          <div className="text-4xl mb-3">🏓</div>
          <p className="text-slate-400 text-lg font-medium mb-1">No bracket yet</p>
          <p className="text-slate-500 text-sm">Be the first to enter! <Link href="/register?sport=pickleball" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Register to play</Link></p>
        </div>
      ) : (
        <div ref={pbContainerRef} className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0e14] border border-white/[0.06] p-4 md:p-6">
          {pbContainerW > 0 && <>
            {/* Round headers */}
            <div className="flex mb-3">
              {rounds.map((_, ri) => {
                const isFinal = ri === totalRounds - 1;
                return (
                  <div key={ri} style={{ width: COL_W + (ri < totalRounds - 1 ? CONN_W : 0), flexShrink: 0 }} className="text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${isFinal ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-white/[0.03] text-slate-500 border-white/[0.06]"}`}>
                      {getRoundLabel(ri)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bracket canvas */}
            <div className="relative" style={{ height: totalH }}>
              {/* SVG connectors */}
              <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: "visible" }}>
                {roundMatches.map((rm, ri) => {
                  if (ri === totalRounds - 1) return null;
                  const x1 = ri * (COL_W + CONN_W) + COL_W;
                  const xMid = x1 + CONN_W / 2;

                  return rm.map((_, mi) => {
                    if (mi % 2 !== 0) return null;
                    const nextRmLen = roundMatches[ri + 1]?.length || 0;
                    if (mi / 2 >= nextRmLen) return null;
                    const topY = getMatchY(ri, mi) + MATCH_H / 2;
                    const botIdx = mi + 1;
                    if (botIdx >= rm.length) return null;
                    const botY = getMatchY(ri, botIdx) + MATCH_H / 2;
                    const midY = (topY + botY) / 2;

                    return (
                      <g key={`${ri}-${mi}`}>
                        <line x1={x1} y1={topY} x2={xMid} y2={topY} stroke={cat.accent} strokeWidth="1.5" strokeOpacity="0.25" />
                        <line x1={x1} y1={botY} x2={xMid} y2={botY} stroke={cat.accent} strokeWidth="1.5" strokeOpacity="0.25" />
                        <line x1={xMid} y1={topY} x2={xMid} y2={botY} stroke={cat.accent} strokeWidth="1.5" strokeOpacity="0.25" />
                        <line x1={xMid} y1={midY} x2={x1 + CONN_W} y2={midY} stroke={cat.accent} strokeWidth="1.5" strokeOpacity="0.25" />
                        <circle cx={xMid} cy={midY} r="2" fill={cat.accent} fillOpacity="0.4" />
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Match cards */}
              {roundMatches.map((rm, ri) => {
                const isFinal = ri === totalRounds - 1;
                const xOffset = ri * (COL_W + CONN_W);

                return rm.map((m, mi) => {
                  const y = getMatchY(ri, mi);
                  const l1 = entryLabel(m.entry1Id);
                  const l2 = entryLabel(m.entry2Id);
                  const tbd1 = isEntryTbd(m.entry1Id);
                  const tbd2 = isEntryTbd(m.entry2Id);
                  const isBye = m.winnerId && (!m.entry1Id || !m.entry2Id) && m.status === "COMPLETED";
                  const isCompleted = !isBye && m.status === "COMPLETED";
                  const isLive = m.status === "LIVE";
                  const w1 = m.winnerId && m.winnerId === m.entry1Id;
                  const w2 = m.winnerId && m.winnerId === m.entry2Id;

                  return (
                    <div key={m.id} className="absolute" style={{ left: xOffset, top: y, width: COL_W, height: MATCH_H, animation: `fadeIn 0.3s ease-out ${ri * 0.08 + mi * 0.03}s both` }}>
                      <div className={`h-full rounded-lg overflow-hidden border transition-all ${isBye ? "border-white/[0.04] bg-white/[0.01] opacity-50" : isCompleted ? "border-emerald-500/25" : isLive ? "border-red-500/30 bg-red-500/[0.03]" : isFinal ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-transparent" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}>
                        {/* Player 1 */}
                        <div className={`h-[22px] flex items-center px-3 gap-2 ${w1 ? "bg-emerald-500/[0.06]" : ""}`}>
                          <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: tbd1 ? "rgba(55,65,81,0.5)" : cat.accent }}>
                            {tbd1 ? "?" : l1.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-[12px] font-semibold truncate flex-1 ${w1 ? "text-emerald-400" : tbd1 ? "text-slate-600 italic" : "text-slate-200"}`}>
                            {tbd1 ? "TBD" : l1}
                          </span>
                          <span className={`text-[10px] font-mono w-5 text-center ${w1 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{isBye ? "" : m.score1 ?? "-"}</span>
                        </div>
                        {/* Divider */}
                        <div className="h-[12px] flex items-center px-3 border-y border-white/[0.04]" style={{ background: `linear-gradient(90deg, ${cat.accent}06, transparent)` }}>
                          <span className="text-[8px] font-bold text-slate-600 tracking-wider">{isBye ? "BYE" : `M${m.matchNumber}`}</span>
                          {!isBye && isLive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse ml-1" />}
                          {!isBye && isCompleted && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-1" />}
                          <div className="flex-1" />
                          {!isBye && m.scheduledDate && <span className="text-[8px] text-cyan-500/70 font-medium">{new Date(m.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                        </div>
                        {/* Player 2 */}
                        <div className={`h-[22px] flex items-center px-3 gap-2 ${w2 ? "bg-emerald-500/[0.06]" : ""}`}>
                          <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: isBye ? "rgba(55,65,81,0.3)" : tbd2 ? "rgba(55,65,81,0.5)" : cat.accent }}>
                            {isBye ? "-" : tbd2 ? "?" : l2.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-[12px] font-semibold truncate flex-1 ${isBye ? "text-slate-700 italic" : w2 ? "text-emerald-400" : tbd2 ? "text-slate-600 italic" : "text-slate-200"}`}>
                            {isBye ? "BYE" : tbd2 ? "TBD" : l2}
                          </span>
                          <span className={`text-[10px] font-mono w-5 text-center ${w2 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>{isBye ? "" : m.score2 ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })}

              {/* Champion trophy */}
              {totalRounds > 0 && roundMatches[totalRounds - 1]?.length === 1 && (
                <div className="absolute flex items-center gap-2" style={{ left: (totalRounds - 1) * (COL_W + CONN_W) + COL_W + 12, top: getMatchY(totalRounds - 1, 0) + MATCH_H / 2 - 14 }}>
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                    <span className="text-xs">🏆</span>
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>
      )}
      </div>
    </div>
  );
}
