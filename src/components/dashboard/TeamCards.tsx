"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";

interface Player {
  id: string;
  fullName: string;
  preferredRole: string;
  gender?: string;
  email?: string;
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
  color?: string;
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
      ? "bg-pink-50 text-pink-600 border-pink-200"
      : gender === "OTHER"
      ? "bg-violet-50 text-violet-600 border-violet-200"
      : "bg-sky-50 text-sky-600 border-sky-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${styles}`}>
      {gender === "FEMALE" ? "F" : gender === "OTHER" ? "O" : "M"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✅ READY</span>;
  }
  if (status === "COMPLETE") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">📋 SUBMITTED</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ IN PROGRESS</span>;
}

function PlayerProfile({ player, onClose }: { player: Player; onClose: () => void }) {
  const genderLabel = player.gender === "FEMALE" ? "Female" : player.gender === "OTHER" ? "Other" : "Male";
  const genderColor = player.gender === "FEMALE" ? "text-pink-600 bg-pink-50" : player.gender === "OTHER" ? "text-violet-600 bg-violet-50" : "text-sky-600 bg-sky-50";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 border border-brand-100/50" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
            {player.fullName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{player.fullName}</h3>
          {player.email && <p className="text-xs text-slate-400 mt-0.5">{player.email}</p>}
        </div>
        <div className="mt-4 space-y-2">
          {player.gender && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50">
              <span className="text-xs text-slate-500 font-medium">Gender</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${genderColor}`}>{genderLabel}</span>
            </div>
          )}
          {player.preferredRole && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50">
              <span className="text-xs text-slate-500 font-medium">Role</span>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{player.preferredRole}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50">
            <span className="text-xs text-slate-500 font-medium">Type</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {player.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft Pick"}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-brand-50 rounded-xl transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function TeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const maleCount = team.players.filter((p) => p.gender === "MALE").length;
  const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
  const otherCount = team.players.filter((p) => p.gender === "OTHER").length;
  const pct = Math.round((team.memberCount / team.teamSize) * 100);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
    >
      {profilePlayer && <PlayerProfile player={profilePlayer} onClose={() => setProfilePlayer(null)} />}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-brand-100/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored top strip */}
        <div
          className={`h-1.5 ${
            team.color ? "" :
            team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
            "bg-gradient-to-r from-amber-300 to-amber-500"
          }`}
          style={team.color ? { background: team.color } : undefined}
        />

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">{team.name}</h2>
              {(team.captainName || team.captain) && (
                <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className="text-base">👤</span>
                  Captain: <span className="font-medium text-slate-600">{team.captainName || team.captain?.displayName}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50 text-slate-400 hover:text-slate-600 transition-colors text-xl"
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
              <span className="font-semibold text-slate-600">{team.memberCount} / {team.teamSize} players</span>
              <span className="text-slate-400">{pct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                  team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
                  "bg-gradient-to-r from-amber-300 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100">
              <p className="text-xl font-extrabold text-sky-600">{maleCount}</p>
              <p className="text-[10px] text-sky-500 font-semibold uppercase tracking-wider">Male</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-100">
              <p className="text-xl font-extrabold text-pink-600">{femaleCount}</p>
              <p className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">Female</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-xl font-extrabold text-amber-600">{team.slotsRemaining}</p>
              <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">{otherCount > 0 ? `Open (${otherCount} Other)` : "Open Slots"}</p>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="border-t border-brand-50 overflow-y-auto max-h-[40vh] p-6 pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Squad ({team.players.length})
          </h3>
          {team.players.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No players yet</p>
          ) : (
            <div className="space-y-1.5">
              {team.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-50 hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {idx === 0 ? "C" : idx + 1}
                    </span>
                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfilePlayer(player); }}
                        className="text-sm font-semibold text-slate-800 hover:text-brand-700 transition-colors text-left"
                      >
                        {player.fullName}
                      </button>
                      {player.preferredRole && (
                        <p className="text-[11px] text-slate-400">{player.preferredRole}</p>
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
            team.status === "READY" ? "border-emerald-200 hover:border-emerald-300" :
            team.status === "COMPLETE" ? "border-brand-200 hover:border-brand-300" :
            "border-brand-100/50 hover:border-brand-200";

          const barColor =
            team.status === "READY" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
            "bg-gradient-to-r from-amber-300 to-amber-500";

          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`text-left bg-white border-2 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 group hover:-translate-y-1 ${borderColor}`}
            >
              {/* Team name + status */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {team.color && (
                    <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ background: team.color }} />
                  )}
                  <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-brand-700 transition-colors leading-tight">
                    {team.name}
                  </h3>
                </div>
              </div>

              <div className="mb-3">
                <StatusBadge status={team.status} />
              </div>

              {/* Captain */}
              {(team.captainName || team.captain) && (
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <span>👤</span> {team.captainName || team.captain?.displayName}
                </p>
              )}

              {/* Player count bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold">{team.memberCount}/{team.teamSize}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Gender composition + slots */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-semibold border border-sky-100">
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
          <p className="text-slate-400 font-medium">No teams registered yet</p>
          <p className="text-slate-300 text-sm mt-1 mb-4">Teams will appear here once approved by admin</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/status" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Registered? Check your status &rarr;
            </a>
            <span className="text-slate-200">|</span>
            <a href="/register" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Register now &rarr;
            </a>
          </div>
        </div>
      )}
    </>
  );
}
