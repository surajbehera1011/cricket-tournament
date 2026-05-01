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

interface LiveData {
  live: LiveMatch[];
  recent: LiveMatch[];
  upcoming: LiveMatch[];
}

function MatchMiniCard({ match, isLive }: { match: LiveMatch; isLive?: boolean }) {
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
      className={`rounded-xl p-3 border transition-colors ${
        isLive
          ? "bg-red-500/5 border-red-500/20"
          : match.status === "COMPLETED"
          ? "bg-emerald-500/5 border-emerald-500/10"
          : "bg-white/[0.02] border-white/[0.06]"
      }`}
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
        {isLive && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
          </span>
        )}
        {match.status === "COMPLETED" && (
          <span className="text-[10px] font-bold text-emerald-400">Final</span>
        )}
        {match.status === "SCHEDULED" && (
          <span className="text-[10px] font-bold text-slate-500">Upcoming</span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {color1 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color1 }} />
            )}
            <span className={`text-xs font-semibold truncate ${
              match.status === "COMPLETED" && match.score1 && match.score2 && Number(match.score1) > Number(match.score2)
                ? "text-emerald-400"
                : "text-slate-300"
            }`}>
              {name1}
            </span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${
            match.score1 ? "text-white" : "text-slate-600"
          }`}>
            {match.score1 || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {color2 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color2 }} />
            )}
            <span className={`text-xs font-semibold truncate ${
              match.status === "COMPLETED" && match.score1 && match.score2 && Number(match.score2) > Number(match.score1)
                ? "text-emerald-400"
                : "text-slate-300"
            }`}>
              {name2}
            </span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${
            match.score2 ? "text-white" : "text-slate-600"
          }`}>
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
  const [data, setData] = useState<LiveData | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"live" | "recent" | "upcoming">("live");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/live");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.live.length === 0 && json.recent.length > 0) setTab("recent");
        else if (json.live.length === 0 && json.upcoming.length > 0) setTab("upcoming");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasAny = data && (data.live.length > 0 || data.recent.length > 0 || data.upcoming.length > 0);

  if (!hasAny) return null;

  const currentMatches =
    tab === "live" ? data!.live :
    tab === "recent" ? data!.recent :
    data!.upcoming;

  const tabs = [
    { key: "live" as const, label: "Live", count: data!.live.length, dot: true },
    { key: "recent" as const, label: "Recent", count: data!.recent.length },
    { key: "upcoming" as const, label: "Next", count: data!.upcoming.length },
  ].filter((t) => t.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-[9999] w-80 max-h-[70vh] flex flex-col drop-shadow-2xl"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-2.5 bg-dark-400/95 backdrop-blur-xl border border-white/[0.08] rounded-t-xl hover:bg-dark-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          {data!.live.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-sm font-bold text-white">
            {data!.live.length > 0 ? "Live Scores" : "Scoreboard"}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {data!.live.length + data!.recent.length + data!.upcoming.length} matches
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

      {/* Body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-dark-500/95 backdrop-blur-xl border border-t-0 border-white/[0.08] rounded-b-xl"
          >
            {/* Tabs */}
            {tabs.length > 1 && (
              <div className="flex border-b border-white/[0.04] px-2 pt-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      tab === t.key
                        ? "border-brand-500 text-white"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t.dot && t.count > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {t.label}
                    <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded-full">{t.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Match list */}
            <div className="p-2 space-y-2 overflow-y-auto max-h-[50vh]">
              <AnimatePresence mode="popLayout">
                {currentMatches.map((m) => (
                  <MatchMiniCard key={m.id} match={m} isLive={tab === "live"} />
                ))}
              </AnimatePresence>
              {currentMatches.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-4">No matches</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
