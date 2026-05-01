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
  team1: MatchTeam | null;
  team2: MatchTeam | null;
  entry1: string | null;
  entry2: string | null;
}

function MatchMiniCard({ match }: { match: LiveMatch }) {
  const name1 = match.team1?.name || match.entry1 || "TBD";
  const name2 = match.team2?.name || match.entry2 || "TBD";
  const color1 = match.team1?.color;
  const color2 = match.team2?.color;

  const sportIcon = match.sport === "CRICKET" ? "🏏" : "🏓";
  const stageLabel = match.stage === "GROUP"
    ? `${match.groupName || "Group"}`
    : `R${match.roundNumber}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl p-3 border bg-red-500/5 border-red-500/20"
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
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {color1 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color1 }} />
            )}
            <span className="text-xs font-semibold truncate text-slate-300">{name1}</span>
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
            <span className="text-xs font-semibold truncate text-slate-300">{name2}</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${match.score2 ? "text-white" : "text-slate-600"}`}>
            {match.score2 || "-"}
          </span>
        </div>
      </div>

      {match.venue && (
        <p className="text-[10px] text-slate-600 mt-1.5 truncate">📍 {match.venue}</p>
      )}
    </motion.div>
  );
}

export function LiveScoresWidget() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/live");
      if (res.ok) {
        const json = await res.json();
        setLiveMatches(json.live || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (liveMatches.length === 0) return null;

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
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white">Live Scores</span>
          <span className="text-[10px] text-slate-500 font-medium">
            {liveMatches.length} {liveMatches.length === 1 ? "match" : "matches"}
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
            <div className="p-2 space-y-2 overflow-y-auto max-h-[50vh]">
              <AnimatePresence mode="popLayout">
                {liveMatches.map((m) => (
                  <MatchMiniCard key={m.id} match={m} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
