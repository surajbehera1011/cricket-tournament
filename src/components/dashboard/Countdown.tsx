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
      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2">
        <span className="text-lg">🎉</span>
        <span className="text-sm text-emerald-700 font-bold">Tournament has started!</span>
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
    <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-md border border-brand-100/50">
      <span className="text-xs text-slate-400 font-semibold mr-1 uppercase tracking-wider">Starts in</span>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2">
          <div className="bg-gradient-to-b from-brand-50 to-brand-100/60 rounded-xl px-3 py-2 min-w-[52px] text-center border border-brand-200/50">
            <p className="text-xl font-extrabold text-brand-700 tabular-nums leading-tight">{String(u.value).padStart(2, "0")}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{u.label}</p>
          </div>
          {i < units.length - 1 && <span className="text-brand-300 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}
