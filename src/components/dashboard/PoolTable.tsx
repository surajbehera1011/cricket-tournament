"use client";

import { useState } from "react";
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
  if (!gender) return <span className="text-slate-300">—</span>;
  const styles =
    gender === "FEMALE"
      ? "bg-pink-50 text-pink-600 border-pink-200"
      : gender === "OTHER"
      ? "bg-violet-50 text-violet-600 border-violet-200"
      : "bg-sky-50 text-sky-600 border-sky-200";
  const label = gender === "FEMALE" ? "Female" : gender === "OTHER" ? "Other" : "Male";
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles}`}>
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
    <div className="bg-white rounded-2xl border border-brand-100/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-brand-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h3 className={`font-bold text-slate-800 ${tvMode ? "text-tv-xl" : "text-lg"}`}>
            Individual Pool
          </h3>
          <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        {!tvMode && (
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50"
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
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🏏</span>
            <p className="text-slate-400 font-medium">
              {players.length === 0 ? "No individuals in pool" : "No matches for current filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-50">
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-400 uppercase tracking-widest`}>Name</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-400 uppercase tracking-widest`}>Gender</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-400 uppercase tracking-widest`}>Role</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-400 uppercase tracking-widest`}>Experience</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player, idx) => (
                  <tr key={player.id} className={`hover:bg-brand-50/30 transition-colors ${idx !== filtered.length - 1 ? "border-b border-slate-50" : ""}`}>
                    <td className={`py-3.5 px-4 ${nameSize} font-semibold text-slate-800`}>
                      {player.fullName}
                    </td>
                    <td className={`py-3.5 px-4 ${nameSize}`}>
                      <GenderBadge gender={player.gender} />
                    </td>
                    <td className={`py-3.5 px-4 ${nameSize}`}>
                      <Badge variant="info">{player.preferredRole || "—"}</Badge>
                    </td>
                    <td className={`py-3.5 px-4 ${nameSize}`}>
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
      </div>
    </div>
  );
}
