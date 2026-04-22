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
      <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5">
        <span className="text-sm text-white/90 font-medium">Tournament has started!</span>
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
    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-2.5 mt-4">
      <span className="text-xs text-white/60 font-medium mr-1">Starts in</span>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-1.5">
          <div className="bg-white/15 rounded-lg px-2.5 py-1.5 min-w-[44px] text-center">
            <p className="text-lg font-extrabold text-white tabular-nums leading-tight">{String(u.value).padStart(2, "0")}</p>
            <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">{u.label}</p>
          </div>
          {i < units.length - 1 && <span className="text-white/30 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}
