"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: string | null;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  if (remaining.expired) {
    return (
      <div className="inline-flex items-center gap-2 bg-pitch-500/10 border border-pitch-500/20 rounded-full px-5 py-2">
        <span className="text-lg">🎉</span>
        <span className="text-sm text-pitch-400 font-bold">Tournament has started!</span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hrs", value: remaining.hours },
    { label: "Min", value: remaining.minutes },
    { label: "Sec", value: remaining.seconds },
  ];

  return (
    <div className="inline-flex items-center gap-2 dark-card rounded-2xl px-5 py-3 glow-brand">
      <span className="text-xs text-slate-500 font-semibold mr-1 uppercase tracking-wider">Starts in</span>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2">
          <div className="bg-dark-400/80 rounded-xl px-3 py-2 min-w-[52px] text-center border border-white/[0.06]">
            <p className="text-xl font-extrabold text-white tabular-nums leading-tight">{String(u.value).padStart(2, "0")}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{u.label}</p>
          </div>
          {i < units.length - 1 && <span className="text-slate-600 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}
