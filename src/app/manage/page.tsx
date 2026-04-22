"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSSE } from "@/lib/useSSE";

interface Player {
  id: string;
  fullName: string;
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
      ? "bg-pink-50 border-pink-300 text-pink-700"
      : currentGender === "OTHER"
      ? "bg-purple-50 border-purple-300 text-purple-700"
      : "bg-blue-50 border-blue-300 text-blue-700";

  if (!isAdmin) {
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${bgColor}`}>
        {currentGender === "FEMALE" ? "F" : currentGender === "OTHER" ? "O" : "M"}
      </span>
    );
  }

  return (
    <select
      value={currentGender}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer ${bgColor} ${saving ? "opacity-50" : ""}`}
    >
      <option value="MALE">M</option>
      <option value="FEMALE">F</option>
      <option value="OTHER">O</option>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Reject: {team.name}</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select players to move back to the pool. The team will return to INCOMPLETE.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {team.players.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                selected.has(p.id) ? "bg-red-50 border border-red-200" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-red-600"
              />
              <span className="text-sm font-medium text-gray-900">{p.fullName}</span>
              <span className={`text-[10px] px-1 rounded ${p.gender === "FEMALE" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });
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
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(poolData)) setPool(poolData);
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
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleGenderUpdate = (playerId: string, newGender: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        const idx = t.players.findIndex((p) => p.id === playerId);
        if (idx === -1) return t;
        const updatedPlayers = t.players.map((p) => (p.id === playerId ? { ...p, gender: newGender } : p));
        const newFemaleCount = updatedPlayers.filter((p) => p.gender === "FEMALE").length;
        const memberCount = updatedPlayers.length;
        const wasReadyOrComplete = t.status === "COMPLETE" || t.status === "READY";
        return {
          ...t,
          players: updatedPlayers,
          femaleCount: newFemaleCount,
          status: wasReadyOrComplete
            ? t.status
            : memberCount >= t.teamSize && newFemaleCount >= t.minFemaleRequired
            ? "COMPLETE"
            : "INCOMPLETE",
        };
      })
    );
    setPool((prev) => prev.map((p) => (p.id === playerId ? { ...p, gender: newGender } : p)));
  };

  const isFrozen = (team: Team | undefined) =>
    team?.status === "COMPLETE" || team?.status === "READY";

  const handleAssign = async (playerId: string) => {
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
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setPool((prev) => prev.filter((p) => p.id !== playerId));
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTeamId) return t;
          const newPlayer: Player = {
            id: playerToAssign.id,
            fullName: playerToAssign.fullName,
            preferredRole: playerToAssign.preferredRole,
            gender: playerToAssign.gender,
            membershipType: "DRAFT_PICK",
            positionSlot: null,
          };
          const newPlayers = [...t.players, newPlayer];
          const mc = newPlayers.length;
          const fc = newPlayers.filter((p) => p.gender === "FEMALE").length;
          return {
            ...t,
            players: newPlayers,
            memberCount: mc,
            femaleCount: fc,
            slotsRemaining: Math.max(0, t.teamSize - mc),
            status: mc >= t.teamSize && fc >= t.minFemaleRequired ? "COMPLETE" : "INCOMPLETE",
          };
        })
      );
      showMessage("Player assigned successfully", "success");
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
          return {
            ...t,
            players: newPlayers,
            memberCount: mc,
            femaleCount: fc,
            slotsRemaining: Math.max(0, t.teamSize - mc),
            status: mc >= t.teamSize && fc >= t.minFemaleRequired ? "COMPLETE" : "INCOMPLETE",
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-600" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "READY") return <Badge variant="success" className="bg-emerald-600 text-white">READY</Badge>;
    if (status === "COMPLETE") return <Badge variant="info">COMPLETE</Badge>;
    return <Badge variant="warning">INCOMPLETE</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="mt-1 text-gray-600">Manage all teams, assign players, approve or reject</p>
      </div>

      {message.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

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
          <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
          {visibleTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedTeamId === team.id
                  ? "border-cricket-500 bg-cricket-50 ring-2 ring-cricket-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <div className="flex gap-1">
                  {isFrozen(teams.find((t) => t.id === team.id)) && team.status !== "READY" && (
                    <Badge variant="default" className="bg-gray-800 text-white text-[10px]">FROZEN</Badge>
                  )}
                  {statusBadge(team.status)}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span>{team.memberCount}/{team.teamSize} players</span>
                <span className={team.femaleCount >= team.minFemaleRequired ? "text-green-600" : "text-red-500"}>
                  {team.femaleCount}F
                </span>
                {team.slotsRemaining > 0 && (
                  <span className="text-amber-600">{team.slotsRemaining} slots open</span>
                )}
              </div>
              {(team.captainName || team.captain) && (
                <p className="mt-1 text-xs text-gray-400">Captain: {team.captainName || team.captain?.displayName}</p>
              )}
            </button>
          ))}

          {visibleTeams.length === 0 && (
            <p className="text-gray-400 text-center py-8">No teams available</p>
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
                <p className="text-xs text-emerald-600 mt-1 font-medium bg-emerald-50 px-2 py-1 rounded">
                  This team is approved and READY for the tournament.
                </p>
              )}
              {selectedTeam?.status === "COMPLETE" && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500 font-normal bg-gray-100 px-2 py-1 rounded">
                    Team is <strong>complete &amp; frozen</strong>. Awaiting admin approval.
                  </p>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(selectedTeam.id)}
                        loading={actionLoading === selectedTeam.id}
                      >
                        Approve
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
              {selectedTeam && selectedTeam.status === "INCOMPLETE" && (
                <p className="text-xs text-amber-600 mt-1 font-normal bg-amber-50 px-2 py-1 rounded">
                  {selectedTeam.slotsRemaining} slot(s) remaining. {selectedTeam.femaleCount < selectedTeam.minFemaleRequired ? `Need ${selectedTeam.minFemaleRequired - selectedTeam.femaleCount} more female player(s).` : ""}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {selectedTeam ? (
                <div className="space-y-2">
                  {selectedTeam.players.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No players yet</p>
                  ) : (
                    selectedTeam.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{player.fullName}</p>
                          <div className="flex gap-1 mt-0.5 items-center">
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
                        {!isFrozen(selectedTeam) && (
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
                    ))
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Select a team to view roster</p>
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
                <p className="text-gray-400 text-center py-8">No players in pool</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {pool.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{player.fullName}</p>
                        <div className="flex gap-1 mt-0.5 items-center">
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
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAssign(player.id)}
                        loading={actionLoading === player.id}
                        disabled={!selectedTeamId || isFrozen(selectedTeam)}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
