"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSSE } from "@/lib/useSSE";
import { useToast } from "@/components/ui/Toast";

interface Player {
  id: string;
  fullName: string;
  email: string;
  preferredRole: string;
  gender: string;
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
  femaleCount: number;
  minFemaleRequired: number;
  criteriaMet: boolean;
  captainName: string;
  captain: { id: string; displayName: string } | null;
  players: Player[];
}

interface PoolPlayer {
  id: string;
  fullName: string;
  preferredRole: string;
  experienceLevel: string;
  gender: string;
}

function GenderSelect({
  playerId,
  currentGender,
  onUpdate,
}: {
  playerId: string;
  currentGender: string;
  onUpdate: (playerId: string, newGender: string) => void;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [saving, setSaving] = useState(false);

  const handleChange = async (newGender: string) => {
    if (newGender === currentGender) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: newGender }),
      });
      if (res.ok) {
        onUpdate(playerId, newGender);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const bgColor =
    currentGender === "FEMALE"
      ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
      : "bg-sky-500/10 border-sky-500/30 text-sky-400";

  if (!isAdmin) {
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${bgColor}`}>
        {currentGender === "FEMALE" ? "F" : "M"}
      </span>
    );
  }

  return (
    <select
      value={currentGender}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border cursor-pointer ${bgColor} ${saving ? "opacity-50" : ""}`}
    >
      <option value="MALE">M</option>
      <option value="FEMALE">F</option>
    </select>
  );
}

function RejectModal({
  team,
  onClose,
  onConfirm,
}: {
  team: Team;
  onClose: () => void;
  onConfirm: (playerIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    await onConfirm(Array.from(selected));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-400 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/[0.08]">
        <h3 className="text-lg font-bold text-white mb-1">Reject: {team.name}</h3>
        <p className="text-sm text-slate-400 mb-4">
          Select players to move back to the pool. The team will return to INCOMPLETE.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {team.players.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                selected.has(p.id) ? "bg-red-500/100/10 border border-red-500/30" : "bg-white/[0.03] hover:bg-white/[0.04]"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-red-500"
              />
              <span className="text-sm font-medium text-white">{p.fullName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${p.gender === "FEMALE" ? "bg-pink-500/10 text-pink-400 border-pink-500/30" : "bg-sky-500/10 text-sky-400 border-sky-500/30"}`}>
                {p.gender === "FEMALE" ? "F" : "M"}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            disabled={selected.size === 0}
            className="flex-1"
          >
            Reject & Move {selected.size} to Pool
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ManagePage() {
  const { data: session } = useSession();
  const { toast: showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTeam, setRejectTeam] = useState<Team | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [teamsRes, poolRes] = await Promise.all([
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/pool?_t=${ts}`, { cache: "no-store" }),
      ]);
      const teamsData = await teamsRes.json();
      const poolData = await poolRes.json();
      const teamsList = teamsData.teams ?? teamsData;
      const poolList = poolData.players ?? poolData;
      if (Array.isArray(teamsList)) setTeams(teamsList);
      if (Array.isArray(poolList)) setPool(poolList);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSSE(fetchData);

  const visibleTeams = isAdmin
    ? teams
    : teams.filter((t) => t.captain?.id === session?.user?.id);

  useEffect(() => {
    if (!selectedTeamId && visibleTeams.length > 0) {
      setSelectedTeamId(visibleTeams[0].id);
    }
  }, [visibleTeams, selectedTeamId]);

  const selectedTeam = visibleTeams.find((t) => t.id === selectedTeamId);

  const showMessage = (text: string, type: "success" | "error") => {
    showToast(text, type);
  };

  const handleGenderUpdate = (playerId: string, newGender: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        const idx = t.players.findIndex((p) => p.id === playerId);
        if (idx === -1) return t;
        const updatedPlayers = t.players.map((p) => (p.id === playerId ? { ...p, gender: newGender } : p));
        const newFemaleCount = updatedPlayers.filter((p) => p.gender === "FEMALE").length;
        const memberCount = updatedPlayers.length;
        const newCriteriaMet = memberCount >= t.teamSize && newFemaleCount >= t.minFemaleRequired;
        const newStatus = t.status === "COMPLETE" && !newCriteriaMet ? "INCOMPLETE" : t.status;
        return {
          ...t,
          players: updatedPlayers,
          femaleCount: newFemaleCount,
          criteriaMet: newCriteriaMet,
          status: newStatus,
        };
      })
    );
    setPool((prev) => prev.map((p) => (p.id === playerId ? { ...p, gender: newGender } : p)));
  };

  const isFrozen = (team: Team | undefined) =>
    team?.status === "READY";

  const handleAssign = async (playerId: string, slotType: "mandatory" | "extra") => {
    if (!selectedTeamId) return;
    const currentTeam = teams.find((t) => t.id === selectedTeamId);
    if (isFrozen(currentTeam)) {
      showMessage("Team is frozen. Cannot assign players.", "error");
      return;
    }
    const playerToAssign = pool.find((p) => p.id === playerId);
    if (!playerToAssign) return;

    setActionLoading(playerId);
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, slotType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setPool((prev) => prev.filter((p) => p.id !== playerId));
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTeamId) return t;
          const mandatoryCount = getMandatoryPlayers(t).length;
          const extraCount = getExtraPlayers(t).length;
          const newPlayer: Player = {
            id: playerToAssign.id,
            fullName: playerToAssign.fullName,
            email: "",
            preferredRole: playerToAssign.preferredRole,
            gender: playerToAssign.gender,
            membershipType: "DRAFT_PICK",
            positionSlot:
              slotType === "extra"
                ? `Extra ${extraCount + 1}`
                : `Player ${mandatoryCount + 1}`,
          };
          const newPlayers = [...t.players, newPlayer];
          const mc = newPlayers.length;
          const fc = newPlayers.filter((p) => p.gender === "FEMALE").length;
          const newCriteriaMet = mc >= t.teamSize && fc >= t.minFemaleRequired;
          return {
            ...t,
            players: newPlayers,
            memberCount: mc,
            femaleCount: fc,
            criteriaMet: newCriteriaMet,
            slotsRemaining: Math.max(0, t.teamSize - mc),
            status: t.status === "COMPLETE" && !newCriteriaMet ? "INCOMPLETE" : t.status,
          };
        })
      );
      showMessage(`Player assigned as ${slotType}`, "success");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to assign", "error");
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (playerId: string) => {
    if (!selectedTeamId) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    if (isFrozen(team)) {
      showMessage("Team is frozen. Cannot remove players.", "error");
      return;
    }
    const playerToRemove = team?.players.find((p) => p.id === playerId);
    if (!playerToRemove) return;

    setActionLoading(playerId);
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTeamId) return t;
          const newPlayers = t.players.filter((p) => p.id !== playerId);
          const mc = newPlayers.length;
          const fc = newPlayers.filter((p) => p.gender === "FEMALE").length;
          const newCriteriaMet = mc >= t.teamSize && fc >= t.minFemaleRequired;
          return {
            ...t,
            players: newPlayers,
            memberCount: mc,
            femaleCount: fc,
            criteriaMet: newCriteriaMet,
            slotsRemaining: Math.max(0, t.teamSize - mc),
            status: t.status === "COMPLETE" && !newCriteriaMet ? "INCOMPLETE" : t.status,
          };
        })
      );
      setPool((prev) => [
        ...prev,
        {
          id: playerToRemove.id,
          fullName: playerToRemove.fullName,
          preferredRole: playerToRemove.preferredRole,
          experienceLevel: "",
          gender: playerToRemove.gender,
        },
      ]);
      showMessage("Player removed successfully", "success");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to remove", "error");
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (teamId: string) => {
    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status: "READY" } : t)));
      showMessage("Team approved and marked READY!", "success");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitTeam = async (teamId: string) => {
    setActionLoading(`submit-${teamId}`);
    try {
      const res = await fetch(`/api/teams/${teamId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status: "COMPLETE" } : t)));
      showMessage("Team submitted for admin approval!", "success");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to submit team", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (playerIds: string[]) => {
    if (!rejectTeam) return;
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: rejectTeam.id, playerIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showMessage(`Team rejected. ${playerIds.length} player(s) moved to pool.`, "success");
      setRejectTeam(null);
      fetchData();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to reject", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  const MANDATORY_COUNT = 8;
  const EXTRA_LIMIT = 2;
  const MIN_FEMALE_REQUIRED = 1;

  const isExtraPlayer = (player: Player) =>
    player.positionSlot?.startsWith("Extra") === true;

  const getMandatoryPlayers = (team: Team) => team.players.filter((p) => !isExtraPlayer(p));
  const getExtraPlayers = (team: Team) => team.players.filter((p) => isExtraPlayer(p));
  const getMandatoryRemaining = (team: Team) => Math.max(0, MANDATORY_COUNT - getMandatoryPlayers(team).length);
  const getExtraMaleCount = (team: Team) => getExtraPlayers(team).filter((p) => p.gender === "MALE").length;
  const getMandatoryMaleCount = (team: Team) => getMandatoryPlayers(team).filter((p) => p.gender === "MALE").length;
  const getMandatoryFemaleCount = (team: Team) => getMandatoryPlayers(team).filter((p) => p.gender === "FEMALE").length;

  const isMandatoryFull = (team: Team) => getMandatoryPlayers(team).length >= MANDATORY_COUNT;
  const hasMandatoryFemale = (team: Team) => getMandatoryFemaleCount(team) >= MIN_FEMALE_REQUIRED;
  const mandatoryNeedsOnlyFemale = (team: Team) =>
    getMandatoryPlayers(team).length === MANDATORY_COUNT - 1 && getMandatoryFemaleCount(team) < MIN_FEMALE_REQUIRED;

  const canSubmitTeam = (team: Team) =>
    isMandatoryFull(team) && hasMandatoryFemale(team);

  const canAssignMandatory = (team: Team, playerGender: string) => {
    if (isMandatoryFull(team)) return false;
    if (mandatoryNeedsOnlyFemale(team) && playerGender === "MALE") return false;
    return true;
  };

  const canAssignExtra = (team: Team, playerGender: string) => {
    if (getExtraPlayers(team).length >= EXTRA_LIMIT) return false;
    if (playerGender === "MALE" && getExtraMaleCount(team) >= 1) return false;
    return true;
  };

  const statusBadge = (status: string) => {
    if (status === "READY") return <Badge variant="success" className="bg-emerald-500/100 text-white">READY</Badge>;
    if (status === "COMPLETE") return <Badge variant="info">SUBMITTED</Badge>;
    return <Badge variant="warning">INCOMPLETE</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Team Management</h1>
        <p className="mt-1 text-slate-400">Manage all teams, assign players, approve or reject</p>
      </div>

      {/* Team selector */}

      {rejectTeam && (
        <RejectModal
          team={rejectTeam}
          onClose={() => setRejectTeam(null)}
          onConfirm={handleReject}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-white">Teams</h2>
          {visibleTeams.map((team) => {
            const mandPlayers = getMandatoryPlayers(team);
            const extraPlayers = getExtraPlayers(team);
            const mandRemaining = getMandatoryRemaining(team);
            const mandFull = isMandatoryFull(team);
            const hasFemale = hasMandatoryFemale(team);
            const extraFull = extraPlayers.length >= EXTRA_LIMIT;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTeamId === team.id
                    ? "border-brand-500/50 bg-brand-500/100/10 ring-2 ring-brand-500/30"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <div className="flex gap-1">
                    {team.status === "READY" && (
                      <Badge variant="default" className="bg-slate-700 text-white text-[10px]">FROZEN</Badge>
                    )}
                    {statusBadge(team.status)}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-medium ${mandFull ? "text-emerald-400" : "text-red-400"}`}>
                      Mandatory: {mandPlayers.length}/{MANDATORY_COUNT}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className={`font-medium ${extraFull ? "text-emerald-400" : "text-amber-400"}`}>
                      Extra: {extraPlayers.length}/{EXTRA_LIMIT}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={hasFemale ? "text-emerald-400" : "text-red-400 font-semibold"}>
                      {getMandatoryFemaleCount(team)}F {hasFemale ? "ok" : "needed!"}
                    </span>
                    {mandRemaining > 0 && (
                      <span className="text-red-400">{mandRemaining} mandatory needed</span>
                    )}
                  </div>
                </div>
                {(team.captainName || team.captain) && (
                  <p className="mt-1 text-xs text-slate-400">Captain: {team.captainName || team.captain?.displayName}</p>
                )}
              </button>
            );
          })}

          {visibleTeams.length === 0 && (
            <p className="text-slate-400 text-center py-8">No teams available</p>
          )}
        </div>

        {/* Team Roster */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTeam ? `${selectedTeam.name} Roster` : "Select a Team"}
              </CardTitle>
              {selectedTeam?.status === "READY" && (
                <p className="text-xs text-emerald-400 mt-1 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                  This team is approved, READY, and frozen for the tournament.
                </p>
              )}
              {selectedTeam?.status === "COMPLETE" && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-brand-400 font-normal bg-brand-500/10 px-2 py-1 rounded-lg">
                    Team submitted for approval. You can still make changes until admin approves.
                  </p>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(selectedTeam.id)}
                        loading={actionLoading === selectedTeam.id}
                      >
                        Approve &amp; Freeze
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRejectTeam(selectedTeam)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {selectedTeam && selectedTeam.status !== "READY" && selectedTeam.status !== "COMPLETE" && (() => {
                const mandPlayers = getMandatoryPlayers(selectedTeam);
                const mandFull = isMandatoryFull(selectedTeam);
                const hasFemale = hasMandatoryFemale(selectedTeam);
                const extraPlayers = getExtraPlayers(selectedTeam);
                const extraFull = extraPlayers.length >= EXTRA_LIMIT;
                const submitReady = canSubmitTeam(selectedTeam);

                return (
                  <div className="mt-2 space-y-2">
                    <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
                      {/* Mandatory count */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${mandFull ? "text-emerald-400" : "text-red-400"}`}>
                          Mandatory players
                        </span>
                        <span className={`font-bold ${mandFull ? "text-emerald-400" : "text-red-400"}`}>
                          {mandPlayers.length}/{MANDATORY_COUNT}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${mandFull ? "bg-emerald-500/100" : "bg-red-400"}`}
                          style={{ width: `${Math.min(100, (mandPlayers.length / MANDATORY_COUNT) * 100)}%` }}
                        />
                      </div>

                      {/* Female count */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${hasFemale ? "text-emerald-400" : "text-red-400"}`}>
                          Female in mandatory
                        </span>
                        <span className={`font-bold ${hasFemale ? "text-emerald-400" : "text-red-400"}`}>
                          {getMandatoryFemaleCount(selectedTeam)}/{MIN_FEMALE_REQUIRED} min
                        </span>
                      </div>

                      {/* Extra players */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${extraFull ? "text-emerald-400" : "text-amber-400"}`}>
                          Extra players (optional)
                        </span>
                        <span className={`font-bold ${extraFull ? "text-emerald-400" : "text-amber-400"}`}>
                          {extraPlayers.length}/{EXTRA_LIMIT}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Extra: max 1 male allowed, 2 females OK
                      </p>
                    </div>

                    {/* Submission criteria in red when not met */}
                    {!submitReady && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-xs font-semibold text-red-400">Cannot submit — criteria not met:</p>
                        {!mandFull && (
                          <p className="text-xs text-red-400">
                            Need {getMandatoryRemaining(selectedTeam)} more mandatory player(s)
                          </p>
                        )}
                        {!hasFemale && (
                          <p className="text-xs text-red-400">
                            Need at least {MIN_FEMALE_REQUIRED} female in mandatory players
                          </p>
                        )}
                      </div>
                    )}

                    {/* Extra warning when submit is ready but extras not filled */}
                    {submitReady && !extraFull && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                        <p className="text-xs text-amber-400 font-medium">
                          Extra player slots not filled ({extraPlayers.length}/{EXTRA_LIMIT}). You can still submit.
                        </p>
                      </div>
                    )}

                    {submitReady && extraFull && (
                      <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                        All slots filled! Ready to submit.
                      </p>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitTeam(selectedTeam.id)}
                      loading={actionLoading === `submit-${selectedTeam.id}`}
                      disabled={!submitReady}
                      className="w-full"
                    >
                      Submit Team for Approval
                    </Button>
                  </div>
                );
              })()}
            </CardHeader>
            <CardContent>
              {selectedTeam ? (
                <div className="space-y-2">
                  {selectedTeam.players.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No players yet</p>
                  ) : (
                    <>
                      {/* Mandatory players */}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Mandatory ({getMandatoryPlayers(selectedTeam).length}/{MANDATORY_COUNT})
                      </p>
                      {getMandatoryPlayers(selectedTeam).map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                                {player.positionSlot || "Player"}
                              </span>
                              <Link href={`/players/${player.id}`} className="font-medium text-white text-sm hover:text-brand-400 transition-colors">{player.fullName}</Link>
                            </div>
                            {player.email && (
                              <p className="text-[11px] text-slate-400 ml-1 mt-0.5">{player.email}</p>
                            )}
                            <div className="flex gap-1 mt-1 items-center">
                              <GenderSelect
                                playerId={player.id}
                                currentGender={player.gender}
                                onUpdate={handleGenderUpdate}
                              />
                              {player.preferredRole && (
                                <Badge variant="info" className="text-[10px]">{player.preferredRole}</Badge>
                              )}
                              <Badge
                                variant={player.membershipType === "TEAM_SUBMISSION" ? "default" : "info"}
                                className="text-[10px]"
                              >
                                {player.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                          {!isFrozen(selectedTeam) && (isAdmin || player.membershipType !== "TEAM_SUBMISSION") && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemove(player.id)}
                              loading={actionLoading === player.id}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}

                      {/* Extra players */}
                      {getExtraPlayers(selectedTeam).length > 0 && (
                        <>
                          <div className="border-t border-white/[0.08] my-3" />
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1">
                            Extra ({getExtraPlayers(selectedTeam).length}/{EXTRA_LIMIT}) — Optional
                          </p>
                          {getExtraPlayers(selectedTeam).map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-3 bg-emerald-500/100/5 rounded-xl border border-emerald-500/20"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                    {player.positionSlot || "Extra"}
                                  </span>
                                  <Link href={`/players/${player.id}`} className="font-medium text-white text-sm hover:text-brand-400 transition-colors">{player.fullName}</Link>
                                </div>
                                {player.email && (
                                  <p className="text-[11px] text-slate-400 ml-1 mt-0.5">{player.email}</p>
                                )}
                                <div className="flex gap-1 mt-1 items-center">
                                  <GenderSelect
                                    playerId={player.id}
                                    currentGender={player.gender}
                                    onUpdate={handleGenderUpdate}
                                  />
                                  {player.preferredRole && (
                                    <Badge variant="info" className="text-[10px]">{player.preferredRole}</Badge>
                                  )}
                                  <Badge variant="success" className="text-[10px]">Extra</Badge>
                                </div>
                              </div>
                              {!isFrozen(selectedTeam) && (isAdmin || player.membershipType !== "TEAM_SUBMISSION") && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemove(player.id)}
                                  loading={actionLoading === player.id}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Select a team to view roster</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Pool */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Individual Pool ({pool.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pool.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No players in pool</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {pool.map((player) => {
                    const mandOk = selectedTeam
                      ? canAssignMandatory(selectedTeam, player.gender)
                      : false;
                    const extraOk = selectedTeam
                      ? canAssignExtra(selectedTeam, player.gender)
                      : false;
                    const mandHint = selectedTeam && !mandOk
                      ? isMandatoryFull(selectedTeam)
                        ? "Full"
                        : "Females only"
                      : "";
                    const extraHint = selectedTeam && !extraOk
                      ? getExtraPlayers(selectedTeam).length >= EXTRA_LIMIT
                        ? "Full"
                        : "Females only"
                      : "";

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl"
                      >
                        <div className="min-w-0">
                          <Link href={`/players/${player.id}`} className="font-medium text-white text-sm truncate block hover:text-brand-400 transition-colors">{player.fullName}</Link>
                          <div className="flex gap-1 mt-0.5 items-center flex-wrap">
                            <GenderSelect
                              playerId={player.id}
                              currentGender={player.gender}
                              onUpdate={handleGenderUpdate}
                            />
                            <Badge variant="info" className="text-[10px]">{player.preferredRole}</Badge>
                            <Badge
                              variant={
                                player.experienceLevel === "Advanced"
                                  ? "success"
                                  : player.experienceLevel === "Intermediate"
                                  ? "warning"
                                  : "default"
                              }
                              className="text-[10px]"
                            >
                              {player.experienceLevel}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => handleAssign(player.id, "mandatory")}
                            disabled={!selectedTeamId || isFrozen(selectedTeam) || !mandOk || actionLoading === player.id}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                              mandOk && selectedTeamId && !isFrozen(selectedTeam)
                                ? "bg-brand-600 text-white hover:bg-brand-500"
                                : "bg-white/[0.06] text-slate-400 cursor-not-allowed"
                            }`}
                            title={mandHint || "Assign as mandatory player"}
                          >
                            {actionLoading === player.id ? "..." : mandHint || "+ Mandatory"}
                          </button>
                          <button
                            onClick={() => handleAssign(player.id, "extra")}
                            disabled={!selectedTeamId || isFrozen(selectedTeam) || !extraOk || actionLoading === player.id}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all border ${
                              extraOk && selectedTeamId && !isFrozen(selectedTeam)
                                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                : "border-white/[0.08] text-slate-400 bg-white/[0.04] cursor-not-allowed"
                            }`}
                            title={extraHint || "Assign as extra player"}
                          >
                            {actionLoading === player.id ? "..." : extraHint || "+ Extra"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
