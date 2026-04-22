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
      gradient: "from-gray-50 to-white",
      accent: "bg-gray-900",
      textColor: "text-gray-900",
    },
    {
      label: "Ready",
      value: readyTeams,
      icon: "✅",
      gradient: "from-emerald-50 to-white",
      accent: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      label: "Submitted",
      value: completeTeams,
      icon: "📋",
      gradient: "from-blue-50 to-white",
      accent: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "In Progress",
      value: incompleteTeams,
      icon: "⏳",
      gradient: "from-amber-50 to-white",
      accent: "bg-amber-500",
      textColor: "text-amber-700",
    },
    {
      label: "In Pool",
      value: poolCount,
      icon: "👤",
      gradient: "from-purple-50 to-white",
      accent: "bg-purple-500",
      textColor: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card bg-gradient-to-br ${stat.gradient}`}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent} rounded-t-2xl`} />
          <div className="p-5 text-center">
            <span className="text-2xl mb-2 block">{stat.icon}</span>
            <p className={`${textSize} font-extrabold ${stat.textColor}`}>{stat.value}</p>
            <p className={`${labelSize} font-semibold text-gray-400 mt-1 uppercase tracking-widest`}>
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
