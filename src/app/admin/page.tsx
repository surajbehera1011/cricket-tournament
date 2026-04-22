"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface PendingPlayer {
  id: string;
  fullName: string;
  gender: string;
  preferredRole: string;
}

interface PendingTeam {
  id: string;
  name: string;
  captainName: string;
  playerCount: number;
  players: PendingPlayer[];
  createdAt: string;
}

interface PendingIndividual {
  id: string;
  fullName: string;
  gender: string;
  preferredRole: string;
  experienceLevel: string;
  email: string | null;
  createdAt: string;
}

interface CaptainUser {
  id: string;
  email: string;
  displayName: string;
  teams: { id: string; name: string; status: string }[];
}

interface ApprovedTeam {
  id: string;
  name: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [pendingIndividuals, setPendingIndividuals] = useState<PendingIndividual[]>([]);
  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [approvedTeams, setApprovedTeams] = useState<ApprovedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "captains">("pending");

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [selectedIndividuals, setSelectedIndividuals] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [newCaptain, setNewCaptain] = useState({ email: "", displayName: "", password: "", teamId: "" });
  const [creatingCaptain, setCreatingCaptain] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [pendingRes, captainsRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/pending?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/admin/captains?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
      ]);
      const pending = await pendingRes.json();
      const caps = await captainsRes.json();
      const teams = await teamsRes.json();
      if (pending.teams) setPendingTeams(pending.teams);
      if (pending.individuals) setPendingIndividuals(pending.individuals);
      if (Array.isArray(caps)) setCaptains(caps);
      if (Array.isArray(teams)) setApprovedTeams(teams.map((t: any) => ({ id: t.id, name: t.name })));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleIndividual = (id: string) => {
    setSelectedIndividuals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllTeams = () => {
    if (selectedTeams.size === pendingTeams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(pendingTeams.map((t) => t.id)));
    }
  };

  const toggleAllIndividuals = () => {
    if (selectedIndividuals.size === pendingIndividuals.length) {
      setSelectedIndividuals(new Set());
    } else {
      setSelectedIndividuals(new Set(pendingIndividuals.map((p) => p.id)));
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    let approved = 0;
    try {
      for (const teamId of selectedTeams) {
        const res = await fetch("/api/admin/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        });
        if (res.ok) approved++;
      }
      for (const playerId of selectedIndividuals) {
        const res = await fetch(`/api/players/${playerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approve: true }),
        });
        if (res.ok) approved++;
      }
      toast(`Approved ${approved} item(s) successfully!`, "success");
      setSelectedTeams(new Set());
      setSelectedIndividuals(new Set());
      fetchData();
    } catch {
      toast("Some approvals failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApproveTeam = async (teamId: string) => {
    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Team approved!", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTeam = async (teamId: string) => {
    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Team rejected and removed.", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveIndividual = async (playerId: string) => {
    setActionLoading(playerId);
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Player approved and added to pool!", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectIndividual = async (playerId: string) => {
    setActionLoading(playerId);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Player rejected and removed.", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCaptain(true);
    try {
      const res = await fetch("/api/admin/captains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCaptain),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Captain created!", "success");
      setNewCaptain({ email: "", displayName: "", password: "", teamId: "" });
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setCreatingCaptain(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  const totalSelected = selectedTeams.size + selectedIndividuals.size;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Panel</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${tab === "pending" ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 border border-brand-100/50 hover:bg-brand-50"}`}
        >
          Pending Approvals ({pendingTeams.length + pendingIndividuals.length})
        </button>
        <button
          onClick={() => setTab("captains")}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${tab === "captains" ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 border border-brand-100/50 hover:bg-brand-50"}`}
        >
          Captain Management ({captains.length})
        </button>
      </div>

      {tab === "pending" && (
        <div className="space-y-6">
          {/* Bulk action bar */}
          {totalSelected > 0 && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex items-center justify-between animate-slide-in">
              <span className="text-sm font-medium text-brand-700">
                {totalSelected} item{totalSelected > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  loading={bulkLoading}
                >
                  Approve All Selected
                </Button>
                <button
                  onClick={() => { setSelectedTeams(new Set()); setSelectedIndividuals(new Set()); }}
                  className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Pending Teams ({pendingTeams.length})</h2>
              {pendingTeams.length > 0 && (
                <button onClick={toggleAllTeams} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  {selectedTeams.size === pendingTeams.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            {pendingTeams.length === 0 ? (
              <p className="text-slate-400 text-center py-6 bg-surface-50 rounded-xl border border-brand-100/30">No pending team registrations</p>
            ) : (
              <div className="space-y-4">
                {pendingTeams.map((team) => (
                  <Card key={team.id} className={selectedTeams.has(team.id) ? "ring-2 ring-brand-400" : ""}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTeams.has(team.id)}
                            onChange={() => toggleTeam(team.id)}
                            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                          />
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{team.name}</h3>
                            <p className="text-sm text-slate-500">Captain: {team.captainName} &middot; {team.playerCount} players</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {team.players.map((p) => (
                                <span key={p.id} className="inline-flex items-center gap-1 bg-surface-50 px-2 py-1 rounded-lg text-xs border border-brand-100/30">
                                  {p.fullName}
                                  <span className={`font-bold ${p.gender === "FEMALE" ? "text-pink-600" : "text-sky-600"}`}>
                                    {p.gender === "FEMALE" ? "F" : "M"}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button size="sm" onClick={() => handleApproveTeam(team.id)} loading={actionLoading === team.id}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleRejectTeam(team.id)} loading={actionLoading === team.id}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Pending Individuals ({pendingIndividuals.length})</h2>
              {pendingIndividuals.length > 0 && (
                <button onClick={toggleAllIndividuals} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  {selectedIndividuals.size === pendingIndividuals.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            {pendingIndividuals.length === 0 ? (
              <p className="text-slate-400 text-center py-6 bg-surface-50 rounded-xl border border-brand-100/30">No pending individual registrations</p>
            ) : (
              <div className="space-y-3">
                {pendingIndividuals.map((player) => (
                  <Card key={player.id} className={selectedIndividuals.has(player.id) ? "ring-2 ring-brand-400" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIndividuals.has(player.id)}
                            onChange={() => toggleIndividual(player.id)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                          />
                          <div>
                            <p className="font-medium text-slate-800">{player.fullName}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant={player.gender === "FEMALE" ? "danger" : "info"} className="text-[10px]">
                                {player.gender === "FEMALE" ? "F" : player.gender === "OTHER" ? "O" : "M"}
                              </Badge>
                              <Badge variant="info" className="text-[10px]">{player.preferredRole}</Badge>
                              <Badge variant="default" className="text-[10px]">{player.experienceLevel}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveIndividual(player.id)} loading={actionLoading === player.id}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleRejectIndividual(player.id)} loading={actionLoading === player.id}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "captains" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Captain Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCaptain} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Name *</label>
                    <input type="text" required value={newCaptain.displayName}
                      onChange={(e) => setNewCaptain((p) => ({ ...p, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50"
                      placeholder="Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" required value={newCaptain.email}
                      onChange={(e) => setNewCaptain((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50"
                      placeholder="captain@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <input type="text" required minLength={6} value={newCaptain.password}
                      onChange={(e) => setNewCaptain((p) => ({ ...p, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50"
                      placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign Team (optional)</label>
                    <select value={newCaptain.teamId}
                      onChange={(e) => setNewCaptain((p) => ({ ...p, teamId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-surface-50">
                      <option value="">No team yet</option>
                      {approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" loading={creatingCaptain}>Create Captain</Button>
              </form>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Existing Captains</h2>
            {captains.length === 0 ? (
              <p className="text-slate-400 text-center py-6 bg-surface-50 rounded-xl border border-brand-100/30">No captains created yet</p>
            ) : (
              <div className="space-y-3">
                {captains.map((cap) => (
                  <Card key={cap.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{cap.displayName}</p>
                          <p className="text-sm text-slate-500">{cap.email}</p>
                        </div>
                        <div>
                          {cap.teams.length > 0 ? (
                            cap.teams.map((t) => (
                              <Badge key={t.id} variant="success" className="text-xs">{t.name}</Badge>
                            ))
                          ) : (
                            <Badge variant="warning" className="text-xs">No team assigned</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
