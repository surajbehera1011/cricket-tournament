"use client";

import { useEffect, useRef, useState } from "react";

export const STAT_META: Record<string, { label: string; icon: string; accent: string; color: string; bg: string; border: string }> = {
  total: { label: "All Teams", icon: "🏏", accent: "bg-white", color: "text-white", bg: "bg-white/5", border: "border-white/10" },
  ready: { label: "Ready Teams", icon: "✅", accent: "bg-pitch-500", color: "text-pitch-400", bg: "bg-pitch-500/10", border: "border-pitch-500/20" },
  submitted: { label: "Submitted Teams", icon: "📋", accent: "bg-brand-500", color: "text-brand-400", bg: "bg-brand-500/10", border: "border-brand-500/20" },
  in_progress: { label: "In Progress Teams", icon: "⏳", accent: "bg-amber-500", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  pool: { label: "Player Pool", icon: "👤", accent: "bg-violet-500", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    prevTarget.current = target;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}

interface StatsCardsProps {
  totalTeams: number;
  readyTeams: number;
  completeTeams: number;
  incompleteTeams: number;
  poolCount: number;
  tvMode?: boolean;
  onStatClick?: (stat: string) => void;
}

export function StatsCards({ totalTeams, readyTeams, completeTeams, incompleteTeams, poolCount, tvMode, onStatClick }: StatsCardsProps) {
  const textSize = tvMode ? "text-tv-3xl" : "text-3xl";
  const labelSize = tvMode ? "text-tv-base" : "text-xs";

  const animTotal = useCountUp(totalTeams);
  const animReady = useCountUp(readyTeams);
  const animComplete = useCountUp(completeTeams);
  const animIncomplete = useCountUp(incompleteTeams);
  const animPool = useCountUp(poolCount);

  const stats = [
    { key: "total", label: "Total Teams", value: animTotal, icon: "🏏", accent: "bg-white", textColor: "text-white", glow: "" },
    { key: "ready", label: "Ready", value: animReady, icon: "✅", accent: "bg-pitch-500", textColor: "text-pitch-400", glow: "shadow-pitch-500/10" },
    { key: "submitted", label: "Submitted", value: animComplete, icon: "📋", accent: "bg-brand-500", textColor: "text-brand-400", glow: "shadow-brand-500/10" },
    { key: "in_progress", label: "In Progress", value: animIncomplete, icon: "⏳", accent: "bg-amber-500", textColor: "text-amber-400", glow: "shadow-amber-500/10" },
    { key: "pool", label: "In Pool", value: animPool, icon: "👤", accent: "bg-violet-500", textColor: "text-violet-400", glow: "shadow-violet-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <button
          key={stat.key}
          onClick={() => onStatClick?.(stat.key)}
          className={`stat-card ${stat.glow} ${onStatClick ? "cursor-pointer" : ""} text-left`}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent} rounded-t-2xl opacity-80`} />
          <div className="p-5 text-center">
            <span className="text-2xl mb-2 block">{stat.icon}</span>
            <p className={`${textSize} font-extrabold ${stat.textColor} tabular-nums`}>{stat.value}</p>
            <p className={`${labelSize} font-semibold text-slate-500 mt-1 uppercase tracking-widest`}>
              {stat.label}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
