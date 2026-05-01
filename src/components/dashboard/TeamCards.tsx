"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

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
      ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
      : gender === "OTHER"
      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
      : "bg-sky-500/10 text-sky-400 border-sky-500/20";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${styles}`}>
      {gender === "FEMALE" ? "F" : gender === "OTHER" ? "O" : "M"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-pitch-500/10 text-pitch-400 border border-pitch-500/20">✅ READY</span>;
  }
  if (status === "COMPLETE") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">📋 SUBMITTED</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ IN PROGRESS</span>;
}

function PlayerProfile({ player, onClose }: { player: Player; onClose: () => void }) {
  const genderLabel = player.gender === "FEMALE" ? "Female" : player.gender === "OTHER" ? "Other" : "Male";
  const genderColor = player.gender === "FEMALE" ? "text-pink-400 bg-pink-500/10" : player.gender === "OTHER" ? "text-violet-400 bg-violet-500/10" : "text-sky-400 bg-sky-500/10";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="dark-card rounded-2xl shadow-2xl max-w-xs w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
            {player.fullName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-white">{player.fullName}</h3>
          {player.email && <p className="text-xs text-slate-500 mt-0.5">{player.email}</p>}
        </div>
        <div className="mt-4 space-y-2">
          {player.gender && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03]">
              <span className="text-xs text-slate-500 font-medium">Gender</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${genderColor}`}>{genderLabel}</span>
            </div>
          )}
          {player.preferredRole && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03]">
              <span className="text-xs text-slate-500 font-medium">Role</span>
              <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">{player.preferredRole}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-slate-500 font-medium">Type</span>
            <span className="text-xs font-bold text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded-full">
              {player.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft Pick"}
            </span>
          </div>
        </div>
        <Link href={`/players/${player.id}`} className="mt-3 block text-center text-xs text-brand-400 hover:text-brand-300 font-medium">
          View Full Profile &rarr;
        </Link>
        <button onClick={onClose} className="mt-2 w-full py-2 text-sm font-medium text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors">
          Close
        </button>
      </motion.div>
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <AnimatePresence>{profilePlayer && <PlayerProfile player={profilePlayer} onClose={() => setProfilePlayer(null)} />}</AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="dark-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`h-1.5 ${
            team.color ? "" :
            team.status === "READY" ? "bg-gradient-to-r from-pitch-400 to-pitch-500" :
            team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
            "bg-gradient-to-r from-amber-400 to-amber-500"
          }`}
          style={team.color ? { background: team.color } : undefined}
        />

        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">{team.name}</h2>
              {(team.captainName || team.captain) && (
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className="text-base">👤</span>
                  Captain: <span className="font-medium text-slate-300">{team.captainName || team.captain?.displayName}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors text-xl"
            >
              &times;
            </button>
          </div>

          <div className="mt-4">
            <StatusBadge status={team.status} />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-slate-300">{team.memberCount} / {team.teamSize} players</span>
              <span className="text-slate-500">{pct}%</span>
            </div>
            <div className="w-full h-3 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  team.status === "READY" ? "bg-gradient-to-r from-pitch-400 to-pitch-500" :
                  team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
                  "bg-gradient-to-r from-amber-400 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-sky-500/10 rounded-xl p-3 text-center border border-sky-500/15">
              <p className="text-xl font-extrabold text-sky-400">{maleCount}</p>
              <p className="text-[10px] text-sky-500 font-semibold uppercase tracking-wider">Male</p>
            </div>
            <div className="bg-pink-500/10 rounded-xl p-3 text-center border border-pink-500/15">
              <p className="text-xl font-extrabold text-pink-400">{femaleCount}</p>
              <p className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">Female</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/15">
              <p className="text-xl font-extrabold text-amber-400">{team.slotsRemaining}</p>
              <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">{otherCount > 0 ? `Open (${otherCount} Other)` : "Open Slots"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] overflow-y-auto max-h-[40vh] p-6 pt-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Squad ({team.players.length})
          </h3>
          {team.players.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No players yet</p>
          ) : (
            <div className="space-y-1.5">
              {team.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? "bg-pitch-500 text-white" : "bg-white/[0.06] text-slate-400"
                    }`}>
                      {idx === 0 ? "C" : idx + 1}
                    </span>
                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfilePlayer(player); }}
                        className="text-sm font-semibold text-white hover:text-pitch-400 transition-colors text-left"
                      >
                        {player.fullName}
                      </button>
                      {player.preferredRole && (
                        <p className="text-[11px] text-slate-500">{player.preferredRole}</p>
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
      </motion.div>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const maleCount = team.players.filter((p) => p.gender === "MALE").length;
  const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
  const pct = Math.round((team.memberCount / team.teamSize) * 100);
  const previewPlayers = team.players.slice(0, 5);
  const remaining = team.players.length - previewPlayers.length;

  const borderColor =
    team.status === "READY" ? "border-pitch-500/20 hover:border-pitch-500/40" :
    team.status === "COMPLETE" ? "border-brand-500/20 hover:border-brand-500/40" :
    "border-white/[0.06] hover:border-white/[0.12]";

  const barColor =
    team.status === "READY" ? "bg-gradient-to-r from-pitch-400 to-pitch-500" :
    team.status === "COMPLETE" ? "bg-gradient-to-r from-brand-400 to-brand-500" :
    "bg-gradient-to-r from-amber-400 to-amber-500";

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setExpanded(true), 300);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setExpanded(false);
  };

  return (
    <>
      <AnimatePresence>{selectedTeam && <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}</AnimatePresence>
      <motion.div
        layout
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setSelectedTeam(team)}
        className={`text-left bg-dark-400/60 backdrop-blur-sm border-2 rounded-2xl p-5 hover:shadow-lg hover:shadow-black/20 transition-shadow cursor-pointer group ${borderColor}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {team.color && (
              <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10 shadow-sm" style={{ background: team.color }} />
            )}
            <h3 className="text-lg font-extrabold text-white group-hover:text-pitch-400 transition-colors leading-tight">
              {team.name}
            </h3>
          </div>
        </div>

        <div className="mb-3">
          <StatusBadge status={team.status} />
        </div>

        {(team.captainName || team.captain) && (
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <span>👤</span> {team.captainName || team.captain?.displayName}
          </p>
        )}

        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-300">{team.memberCount}/{team.teamSize}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/15">
              {maleCount}M
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-semibold border border-pink-500/15">
              {femaleCount}F
            </span>
          </div>
          {team.slotsRemaining > 0 && (
            <span className="text-[11px] text-amber-400 font-semibold">{team.slotsRemaining} open</span>
          )}
        </div>

        {/* Expandable roster preview */}
        <AnimatePresence>
          {expanded && previewPlayers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Roster Preview</p>
                {previewPlayers.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                      idx === 0 ? "bg-pitch-500 text-white" : "bg-white/[0.06] text-slate-500"
                    }`}>
                      {idx === 0 ? "C" : idx + 1}
                    </span>
                    <span className="text-xs text-slate-300 font-medium truncate">{p.fullName}</span>
                    <GenderBadge gender={p.gender} />
                  </div>
                ))}
                {remaining > 0 && (
                  <p className="text-[10px] text-slate-500 pl-7">+{remaining} more</p>
                )}
                <p className="text-[10px] text-brand-400 font-medium pt-1">Click for full details &rarr;</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export function TeamCards({ teams }: TeamCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🏏</span>
          <p className="text-slate-400 font-medium">No teams registered yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Teams will appear here once approved by admin</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/status" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">
              Registered? Check your status &rarr;
            </a>
            <span className="text-slate-600">|</span>
            <a href="/register" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">
              Register now &rarr;
            </a>
          </div>
        </div>
      )}
    </>
  );
}
