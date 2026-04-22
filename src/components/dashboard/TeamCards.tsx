"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";

interface Player {
  id: string;
  fullName: string;
  preferredRole: string;
  gender?: string;
  membershipType: string;
  positionSlot: string | null;
}

interface Team {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  teamSize: number;
  slotsRemaining: number;
  femaleCount?: number;
  captainName: string;
  captain: { displayName: string } | null;
  players: Player[];
}

interface TeamCardsProps {
  teams: Team[];
  tvMode?: boolean;
}

function GenderBadge({ gender }: { gender?: string }) {
  if (!gender) return null;
  const styles =
    gender === "FEMALE"
      ? "bg-pink-50 text-pink-700 border-pink-200"
      : gender === "OTHER"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles}`}>
      {gender === "FEMALE" ? "F" : gender === "OTHER" ? "O" : "M"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✅ READY</span>;
  }
  if (status === "COMPLETE") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">📋 SUBMITTED</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⏳ IN PROGRESS</span>;
}

function TeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const maleCount = team.players.filter((p) => p.gender === "MALE").length;
  const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
  const otherCount = team.players.filter((p) => p.gender === "OTHER").length;
  const pct = Math.round((team.memberCount / team.teamSize) * 100);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored top strip */}
        <div className={`h-2 ${
          team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
          team.status === "COMPLETE" ? "bg-gradient-to-r from-blue-400 to-blue-600" :
          "bg-gradient-to-r from-amber-400 to-amber-600"
        }`} />

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{team.name}</h2>
              {(team.captainName || team.captain) && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <span className="text-base">👤</span>
                  Captain: <span className="font-medium text-gray-700">{team.captainName || team.captain?.displayName}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl"
            >
              &times;
            </button>
          </div>

          <div className="mt-4">
            <StatusBadge status={team.status} />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-gray-700">{team.memberCount} / {team.teamSize} players</span>
              <span className="text-gray-400">{pct}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                  team.status === "COMPLETE" ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                  "bg-gradient-to-r from-amber-300 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-blue-700">{maleCount}</p>
              <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Male</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-pink-700">{femaleCount}</p>
              <p className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">Female</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-amber-700">{team.slotsRemaining}</p>
              <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">{otherCount > 0 ? `Open (${otherCount} Other)` : "Open Slots"}</p>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="border-t border-gray-100 overflow-y-auto max-h-[40vh] p-6 pt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Squad ({team.players.length})
          </h3>
          {team.players.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No players yet</p>
          ) : (
            <div className="space-y-1.5">
              {team.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? "bg-cricket-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {idx === 0 ? "C" : idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{player.fullName}</p>
                      {player.preferredRole && (
                        <p className="text-[11px] text-gray-400">{player.preferredRole}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GenderBadge gender={player.gender} />
                    <Badge
                      variant={player.membershipType === "TEAM_SUBMISSION" ? "info" : "default"}
                      className="text-[10px]"
                    >
                      {player.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TeamCards({ teams, tvMode }: TeamCardsProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  return (
    <>
      {selectedTeam && (
        <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map((team) => {
          const maleCount = team.players.filter((p) => p.gender === "MALE").length;
          const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
          const pct = Math.round((team.memberCount / team.teamSize) * 100);

          const borderColor =
            team.status === "READY" ? "border-emerald-200 hover:border-emerald-400" :
            team.status === "COMPLETE" ? "border-blue-200 hover:border-blue-400" :
            "border-gray-200 hover:border-cricket-300";

          const barColor =
            team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            team.status === "COMPLETE" ? "bg-gradient-to-r from-blue-400 to-blue-500" :
            "bg-gradient-to-r from-amber-300 to-amber-500";

          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`text-left bg-white border-2 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 group hover:-translate-y-1 ${borderColor}`}
            >
              {/* Team name + status */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-cricket-700 transition-colors leading-tight">
                  {team.name}
                </h3>
              </div>

              <div className="mb-3">
                <StatusBadge status={team.status} />
              </div>

              {/* Captain */}
              {(team.captainName || team.captain) && (
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  <span>👤</span> {team.captainName || team.captain?.displayName}
                </p>
              )}

              {/* Player count bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-semibold">{team.memberCount}/{team.teamSize}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Gender composition + slots */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                    {maleCount}M
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold border border-pink-100">
                    {femaleCount}F
                  </span>
                </div>
                {team.slotsRemaining > 0 && (
                  <span className="text-[11px] text-amber-600 font-semibold">{team.slotsRemaining} open</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🏏</span>
          <p className="text-gray-400 font-medium">No teams registered yet</p>
          <p className="text-gray-300 text-sm mt-1">Teams will appear here once approved by admin</p>
        </div>
      )}
    </>
  );
}
