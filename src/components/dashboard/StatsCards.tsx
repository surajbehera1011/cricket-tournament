"use client";

interface StatsCardsProps {
  totalTeams: number;
  readyTeams: number;
  completeTeams: number;
  incompleteTeams: number;
  poolCount: number;
  tvMode?: boolean;
}

export function StatsCards({ totalTeams, readyTeams, completeTeams, incompleteTeams, poolCount, tvMode }: StatsCardsProps) {
  const textSize = tvMode ? "text-tv-3xl" : "text-3xl";
  const labelSize = tvMode ? "text-tv-base" : "text-xs";

  const stats = [
    {
      label: "Total Teams",
      value: totalTeams,
      icon: "🏏",
      bg: "bg-slate-50",
      accent: "bg-slate-800",
      textColor: "text-slate-800",
      border: "border-slate-100",
    },
    {
      label: "Ready",
      value: readyTeams,
      icon: "✅",
      bg: "bg-emerald-50",
      accent: "bg-emerald-500",
      textColor: "text-emerald-700",
      border: "border-emerald-100",
    },
    {
      label: "Submitted",
      value: completeTeams,
      icon: "📋",
      bg: "bg-brand-50",
      accent: "bg-brand-500",
      textColor: "text-brand-700",
      border: "border-brand-100",
    },
    {
      label: "In Progress",
      value: incompleteTeams,
      icon: "⏳",
      bg: "bg-amber-50",
      accent: "bg-amber-500",
      textColor: "text-amber-700",
      border: "border-amber-100",
    },
    {
      label: "In Pool",
      value: poolCount,
      icon: "👤",
      bg: "bg-violet-50",
      accent: "bg-violet-500",
      textColor: "text-violet-700",
      border: "border-violet-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card ${stat.bg} ${stat.border}`}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent} rounded-t-2xl`} />
          <div className="p-5 text-center">
            <span className="text-2xl mb-2 block">{stat.icon}</span>
            <p className={`${textSize} font-extrabold ${stat.textColor}`}>{stat.value}</p>
            <p className={`${labelSize} font-semibold text-slate-400 mt-1 uppercase tracking-widest`}>
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
