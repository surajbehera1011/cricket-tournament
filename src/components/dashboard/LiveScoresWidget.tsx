"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchTeam {
  name: string;
  color: string | null;
}

interface LiveMatch {
  id: string;
  sport: string;
  stage: string;
  groupName: string | null;
  roundNumber: number;
  matchNumber: number;
  category: string | null;
  status: string;
  score1: string | null;
  score2: string | null;
  winnerId: string | null;
  scheduledDate: string | null;
  venue: string | null;
  team1Id: string | null;
  team2Id: string | null;
  entry1Id: string | null;
  entry2Id: string | null;
  team1: MatchTeam | null;
  team2: MatchTeam | null;
  entry1: string | null;
  entry2: string | null;
}

function MatchMiniCard({ match, variant }: { match: LiveMatch; variant: "live" | "recent" }) {
  const name1 = match.team1?.name || match.entry1 || "TBD";
  const name2 = match.team2?.name || match.entry2 || "TBD";
  const color1 = match.team1?.color;
  const color2 = match.team2?.color;

  const sportIcon = match.sport === "CRICKET" ? "\u{1F3CF}" : "\u{1F3D3}";
  const stageLabel = match.stage === "GROUP"
    ? `${match.groupName || "Group"}`
    : `R${match.roundNumber}`;

  const isRecent = variant === "recent";
  const p1Id = match.team1Id || match.entry1Id;
  const p2Id = match.team2Id || match.entry2Id;
  const isP1Winner = isRecent && match.winnerId === p1Id;
  const isP2Winner = isRecent && match.winnerId === p2Id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-xl p-3 border ${isRecent ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{sportIcon}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {stageLabel} &middot; M{match.matchNumber}
          </span>
          {match.category && (
            <span className="text-[9px] font-semibold text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
              {match.category.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {isRecent ? (
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Completed</span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {color1 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color1 }} />
            )}
            <span className={`text-xs font-semibold truncate ${isRecent && isP1Winner ? "text-emerald-400" : "text-slate-300"}`}>{name1}</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${match.score1 ? "text-white" : "text-slate-600"}`}>
            {match.score1 || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {color2 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color2 }} />
            )}
            <span className={`text-xs font-semibold truncate ${isRecent && isP2Winner ? "text-emerald-400" : "text-slate-300"}`}>{name2}</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${match.score2 ? "text-white" : "text-slate-600"}`}>
            {match.score2 || "-"}
          </span>
        </div>
      </div>

      {match.venue && (
        <p className="text-[10px] text-slate-600 mt-1.5 truncate">{match.venue}</p>
      )}
    </motion.div>
  );
}

export function LiveScoresWidget() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<LiveMatch[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"live" | "recent">("live");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/live");
      if (res.ok) {
        const json = await res.json();
        const live = json.live || [];
        const recent = json.recent || [];
        setLiveMatches(live);
        setRecentMatches(recent);
        if (live.length === 0 && recent.length > 0) setTab("recent");
        else if (live.length > 0) setTab("live");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasLive = liveMatches.length > 0;
  const hasRecent = recentMatches.length > 0;

  if (!hasLive && !hasRecent) return null;

  const activeMatches = tab === "live" ? liveMatches : recentMatches;
  const liveCount = liveMatches.length;
  const recentCount = recentMatches.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-[9999] w-80 max-h-[70vh] flex flex-col drop-shadow-2xl"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-2.5 bg-dark-400/95 backdrop-blur-xl border border-white/[0.08] rounded-t-xl hover:bg-dark-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          {hasLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-sm font-bold text-white">Scoreboard</span>
          <span className="text-[10px] text-slate-500 font-medium">
            {hasLive ? `${liveCount} live` : ""}{hasLive && hasRecent ? " / " : ""}{hasRecent ? `${recentCount} recent` : ""}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-dark-500/95 backdrop-blur-xl border border-t-0 border-white/[0.08] rounded-b-xl"
          >
            {(hasLive && hasRecent) && (
              <div className="flex border-b border-white/[0.06]">
                <button
                  onClick={() => setTab("live")}
                  className={`flex-1 text-[11px] font-bold py-1.5 transition-colors ${tab === "live" ? "text-red-400 border-b-2 border-red-400" : "text-slate-500 hover:text-slate-400"}`}
                >
                  Live ({liveCount})
                </button>
                <button
                  onClick={() => setTab("recent")}
                  className={`flex-1 text-[11px] font-bold py-1.5 transition-colors ${tab === "recent" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-500 hover:text-slate-400"}`}
                >
                  Recent ({recentCount})
                </button>
              </div>
            )}
            <div className="p-2 space-y-2 overflow-y-auto max-h-[50vh]">
              <AnimatePresence mode="popLayout">
                {activeMatches.map((m) => (
                  <MatchMiniCard key={m.id} match={m} variant={tab} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
