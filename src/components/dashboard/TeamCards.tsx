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
  const variant =
    status === "READY" ? "success" : status === "COMPLETE" ? "info" : "warning";
  return <Badge variant={variant}>{status}</Badge>;
}

function TeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const maleCount = team.players.filter((p) => p.gender === "MALE").length;
  const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
  const otherCount = team.players.filter((p) => p.gender === "OTHER").length;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
              {(team.captainName || team.captain) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Captain: {team.captainName || team.captain?.displayName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={team.status} />
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{team.memberCount}</p>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{team.teamSize}</p>
              <p className="text-xs text-gray-500">Team Size</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{team.slotsRemaining}</p>
              <p className="text-xs text-gray-500">Open Slots</p>
            </div>
          </div>

          {/* Gender breakdown */}
          <div className="flex gap-3 mt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {maleCount} Male
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              {femaleCount} Female
            </span>
            {otherCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {otherCount} Other
              </span>
            )}
          </div>
        </div>

        {/* Player List */}
        <div className="overflow-y-auto max-h-[45vh] p-6 pt-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Team Members
          </h3>
          {team.players.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No players yet</p>
          ) : (
            <div className="space-y-2">
              {team.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-cricket-100 text-cricket-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{player.fullName}</p>
                      {player.preferredRole && (
                        <p className="text-xs text-gray-400">{player.preferredRole}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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

  const nameSize = tvMode ? "text-tv-lg" : "text-lg";

  return (
    <>
      {selectedTeam && (
        <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map((team) => {
          const maleCount = team.players.filter((p) => p.gender === "MALE").length;
          const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;

          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-cricket-300 hover:shadow-md transition-all group"
            >
              {/* Team name + status */}
              <div className="flex items-start justify-between mb-3">
                <h3 className={`${nameSize} font-bold text-gray-900 group-hover:text-cricket-700 transition-colors leading-tight`}>
                  {team.name}
                </h3>
                <StatusBadge status={team.status} />
              </div>

              {/* Captain */}
              {(team.captainName || team.captain) && (
                <p className="text-xs text-gray-400 mb-3">
                  Captain: {team.captainName || team.captain?.displayName}
                </p>
              )}

              {/* Player count bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{team.memberCount} / {team.teamSize} players</span>
                  {team.slotsRemaining > 0 && (
                    <span className="text-amber-600 font-medium">{team.slotsRemaining} open</span>
                  )}
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      team.status === "READY"
                        ? "bg-emerald-500"
                        : team.status === "COMPLETE"
                        ? "bg-blue-500"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, (team.memberCount / team.teamSize) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Gender composition */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {maleCount}M
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-medium">
                  {femaleCount}F
                </span>
              </div>

              {/* Click hint */}
              <p className="text-[10px] text-gray-300 mt-3 group-hover:text-gray-400 transition-colors">
                Click to view details
              </p>
            </button>
          );
        })}
      </div>

      {teams.length === 0 && (
        <p className="text-gray-400 text-center py-8">No teams registered yet</p>
      )}
    </>
  );
}
