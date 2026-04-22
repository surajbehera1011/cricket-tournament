"use client";

import { Card } from "@/components/ui/Card";

interface StatsCardsProps {
  totalTeams: number;
  completeTeams: number;
  incompleteTeams: number;
  poolCount: number;
  tvMode?: boolean;
}

export function StatsCards({ totalTeams, completeTeams, incompleteTeams, poolCount, tvMode }: StatsCardsProps) {
  const textSize = tvMode ? "text-tv-3xl" : "text-4xl";
  const labelSize = tvMode ? "text-tv-base" : "text-sm";

  const stats = [
    { label: "Total Teams", value: totalTeams, color: "text-gray-900", bg: "bg-white" },
    { label: "Complete", value: completeTeams, color: "text-green-700", bg: "bg-green-50" },
    { label: "Incomplete", value: incompleteTeams, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "In Pool", value: poolCount, color: "text-blue-700", bg: "bg-blue-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={stat.bg}>
          <div className="p-6 text-center">
            <p className={`${textSize} font-bold ${stat.color}`}>{stat.value}</p>
            <p className={`${labelSize} font-medium text-gray-500 mt-1 uppercase tracking-wide`}>
              {stat.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
