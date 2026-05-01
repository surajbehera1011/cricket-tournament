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
  if (!gender) return <span className="text-slate-600">—</span>;
  const styles =
    gender === "FEMALE"
      ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
      : "bg-sky-500/10 text-sky-400 border-sky-500/20";
  const label = gender === "FEMALE" ? "Female" : "Male";
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
    <div className="dark-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h3 className={`font-bold text-white ${tvMode ? "text-tv-xl" : "text-lg"}`}>
            Individual Pool
          </h3>
          <span className="bg-violet-500/10 text-violet-400 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-500/20">
            {filtered.length}
          </span>
        </div>
        {!tvMode && (
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-white/[0.06] rounded-xl px-3 py-2 focus:ring-2 focus:ring-pitch-500/50 focus:border-pitch-500/30 bg-dark-400 text-slate-300"
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
              className="text-sm border border-white/[0.06] rounded-xl px-3 py-2 focus:ring-2 focus:ring-pitch-500/50 focus:border-pitch-500/30 bg-dark-400 text-slate-300"
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
            <p className="text-slate-500 font-medium">
              {players.length === 0 ? "No individuals in pool yet" : "No matches for current filters"}
            </p>
            {players.length === 0 && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <a href="/status" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">
                  Registered? Check your status &rarr;
                </a>
                <span className="text-slate-600">|</span>
                <a href="/register" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">
                  Register now &rarr;
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-500 uppercase tracking-widest`}>Name</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-500 uppercase tracking-widest`}>Gender</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-500 uppercase tracking-widest`}>Role</th>
                  <th className={`text-left py-3 px-4 ${detailSize} font-bold text-slate-500 uppercase tracking-widest`}>Experience</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player, idx) => (
                  <tr key={player.id} className={`hover:bg-white/[0.02] transition-colors ${idx !== filtered.length - 1 ? "border-b border-white/[0.03]" : ""}`}>
                    <td className={`py-3.5 px-4 ${nameSize} font-semibold text-white`}>
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
