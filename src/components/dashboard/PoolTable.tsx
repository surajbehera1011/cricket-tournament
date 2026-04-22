"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PoolPlayer {
  id: string;
  fullName: string;
  preferredRole: string;
  experienceLevel: string;
  gender?: string;
  comments: string | null;
}

interface PoolTableProps {
  players: PoolPlayer[];
  tvMode?: boolean;
}

function GenderBadge({ gender }: { gender?: string }) {
  if (!gender) return <span className="text-gray-300">—</span>;
  const styles =
    gender === "FEMALE"
      ? "bg-pink-50 text-pink-700 border-pink-200"
      : gender === "OTHER"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  const label = gender === "FEMALE" ? "Female" : gender === "OTHER" ? "Other" : "Male";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles}`}>
      {label}
    </span>
  );
}

export function PoolTable({ players, tvMode }: PoolTableProps) {
  const [roleFilter, setRoleFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");

  const filtered = players.filter((p) => {
    if (roleFilter && !p.preferredRole.toLowerCase().includes(roleFilter.toLowerCase())) return false;
    if (expFilter && p.experienceLevel !== expFilter) return false;
    return true;
  });

  const nameSize = tvMode ? "text-tv-lg" : "text-sm";
  const detailSize = tvMode ? "text-tv-sm" : "text-xs";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className={tvMode ? "text-tv-xl" : ""}>
            Individual Pool ({filtered.length})
          </CardTitle>
          {!tvMode && (
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket Keeper">Wicket Keeper</option>
              </select>
              <select
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            {players.length === 0 ? "No individuals in pool" : "No matches for current filters"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={`text-left py-3 px-2 ${detailSize} font-semibold text-gray-500 uppercase tracking-wide`}>Name</th>
                  <th className={`text-left py-3 px-2 ${detailSize} font-semibold text-gray-500 uppercase tracking-wide`}>Gender</th>
                  <th className={`text-left py-3 px-2 ${detailSize} font-semibold text-gray-500 uppercase tracking-wide`}>Role</th>
                  <th className={`text-left py-3 px-2 ${detailSize} font-semibold text-gray-500 uppercase tracking-wide`}>Experience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className={`py-3 px-2 ${nameSize} font-medium text-gray-900`}>
                      {player.fullName}
                    </td>
                    <td className={`py-3 px-2 ${nameSize}`}>
                      <GenderBadge gender={player.gender} />
                    </td>
                    <td className={`py-3 px-2 ${nameSize}`}>
                      <Badge variant="info">{player.preferredRole || "—"}</Badge>
                    </td>
                    <td className={`py-3 px-2 ${nameSize}`}>
                      <Badge
                        variant={
                          player.experienceLevel === "Advanced"
                            ? "success"
                            : player.experienceLevel === "Intermediate"
                            ? "warning"
                            : "default"
                        }
                      >
                        {player.experienceLevel || "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
