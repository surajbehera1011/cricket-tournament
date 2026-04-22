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

interface PendingPickleball {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
  status?: string;
  createdAt: string;
}

const PB_LABELS: Record<string, string> = {
  MENS_SINGLES: "Men's Singles",
  WOMENS_SINGLES: "Women's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [pendingIndividuals, setPendingIndividuals] = useState<PendingIndividual[]>([]);
  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [approvedTeams, setApprovedTeams] = useState<ApprovedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "pickleball" | "captains">("pending");

  const [pendingPickleball, setPendingPickleball] = useState<PendingPickleball[]>([]);
  const [allPickleball, setAllPickleball] = useState<PendingPickleball[]>([]);
  const [pbSubTab, setPbSubTab] = useState<"pending" | "manage">("pending");
  const [selectedPb, setSelectedPb] = useState<Set<string>>(new Set());
  const [editingPb, setEditingPb] = useState<string | null>(null);
  const [editP1, setEditP1] = useState("");
  const [editP2, setEditP2] = useState("");
  const [pbFilterCat, setPbFilterCat] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [selectedIndividuals, setSelectedIndividuals] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [newCaptain, setNewCaptain] = useState({ email: "", displayName: "", password: "", teamId: "" });
  const [creatingCaptain, setCreatingCaptain] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [pendingRes, captainsRes, teamsRes, pbRes, pbAllRes] = await Promise.all([
        fetch(`/api/admin/pending?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/admin/captains?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/teams?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/admin/pickleball-pending?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/admin/pickleball-pending?view=all&_t=${ts}`, { cache: "no-store" }),
      ]);
      const pending = await pendingRes.json();
      const caps = await captainsRes.json();
      const teams = await teamsRes.json();
      const pbPending = await pbRes.json();
      const pbAll = await pbAllRes.json();
      if (pending.teams) setPendingTeams(pending.teams);
      if (pending.individuals) setPendingIndividuals(pending.individuals);
      if (Array.isArray(caps)) setCaptains(caps);
      if (Array.isArray(teams)) setApprovedTeams(teams.map((t: any) => ({ id: t.id, name: t.name })));
      if (Array.isArray(pbPending)) setPendingPickleball(pbPending);
      if (Array.isArray(pbAll)) setAllPickleball(pbAll);
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
        <button
          onClick={() => setTab("pickleball")}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${tab === "pickleball" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-brand-100/50 hover:bg-brand-50"}`}
        >
          🏓 Pickleball ({pendingPickleball.length})
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

      {tab === "pickleball" && (
        <div className="space-y-4">
          {/* Pickleball sub-tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPbSubTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${pbSubTab === "pending" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              Pending ({pendingPickleball.length})
            </button>
            <button
              onClick={() => setPbSubTab("manage")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${pbSubTab === "manage" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              Manage All ({allPickleball.length})
            </button>
          </div>

          {pbSubTab === "pending" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Pending Pickleball Registrations</h2>
                {pendingPickleball.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (selectedPb.size === pendingPickleball.length) setSelectedPb(new Set());
                        else setSelectedPb(new Set(pendingPickleball.map((r) => r.id)));
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {selectedPb.size === pendingPickleball.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk action bar */}
              {selectedPb.size > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between animate-slide-in">
                  <span className="text-sm font-medium text-emerald-700">
                    {selectedPb.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={bulkLoading}
                      onClick={async () => {
                        setBulkLoading(true);
                        try {
                          const res = await fetch("/api/admin/pickleball-pending", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: Array.from(selectedPb), action: "approve" }),
                          });
                          if (!res.ok) throw new Error((await res.json()).error);
                          toast(`Approved ${selectedPb.size} registration(s)!`, "success");
                          setSelectedPb(new Set());
                          fetchData();
                        } catch (err) {
                          toast(err instanceof Error ? err.message : "Failed", "error");
                        } finally {
                          setBulkLoading(false);
                        }
                      }}
                    >
                      Approve Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={bulkLoading}
                      onClick={async () => {
                        setBulkLoading(true);
                        try {
                          const res = await fetch("/api/admin/pickleball-pending", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: Array.from(selectedPb), action: "reject" }),
                          });
                          if (!res.ok) throw new Error((await res.json()).error);
                          toast(`Rejected ${selectedPb.size} registration(s).`, "success");
                          setSelectedPb(new Set());
                          fetchData();
                        } catch (err) {
                          toast(err instanceof Error ? err.message : "Failed", "error");
                        } finally {
                          setBulkLoading(false);
                        }
                      }}
                    >
                      Reject Selected
                    </Button>
                    <button onClick={() => setSelectedPb(new Set())} className="text-sm text-slate-500 hover:text-slate-700 px-2">Clear</button>
                  </div>
                </div>
              )}

              {pendingPickleball.length === 0 ? (
                <p className="text-slate-400 text-center py-6 bg-surface-50 rounded-xl border border-brand-100/30">No pending pickleball registrations</p>
              ) : (
                <div className="space-y-3">
                  {pendingPickleball.map((reg) => (
                    <Card key={reg.id} className={selectedPb.has(reg.id) ? "ring-2 ring-emerald-400" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPb.has(reg.id)}
                              onChange={() => {
                                setSelectedPb((prev) => {
                                  const next = new Set(prev);
                                  next.has(reg.id) ? next.delete(reg.id) : next.add(reg.id);
                                  return next;
                                });
                              }}
                              className="mt-1.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                            />
                            <div>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {PB_LABELS[reg.category] || reg.category}
                              </span>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                  {reg.player1Name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{reg.player1Name}</p>
                                  <p className="text-[11px] text-slate-400">{reg.player1Email}</p>
                                </div>
                              </div>
                              {reg.player2Name && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                                    {reg.player2Name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{reg.player2Name}</p>
                                    <p className="text-[11px] text-slate-400">{reg.player2Email}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <Button size="sm" loading={actionLoading === reg.id}
                              onClick={async () => {
                                setActionLoading(reg.id);
                                try {
                                  const res = await fetch("/api/admin/pickleball-pending", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: reg.id, action: "approve" }),
                                  });
                                  if (!res.ok) throw new Error((await res.json()).error);
                                  toast("Approved!", "success");
                                  fetchData();
                                } catch (err) {
                                  toast(err instanceof Error ? err.message : "Failed", "error");
                                } finally { setActionLoading(null); }
                              }}
                            >Approve</Button>
                            <Button size="sm" variant="danger" loading={actionLoading === reg.id}
                              onClick={async () => {
                                setActionLoading(reg.id);
                                try {
                                  const res = await fetch("/api/admin/pickleball-pending", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: reg.id, action: "reject" }),
                                  });
                                  if (!res.ok) throw new Error((await res.json()).error);
                                  toast("Rejected.", "success");
                                  fetchData();
                                } catch (err) {
                                  toast(err instanceof Error ? err.message : "Failed", "error");
                                } finally { setActionLoading(null); }
                              }}
                            >Reject</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {pbSubTab === "manage" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">All Pickleball Registrations</h2>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPbFilterCat("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!pbFilterCat ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
                >
                  All ({allPickleball.length})
                </button>
                {Object.entries(PB_LABELS).map(([key, label]) => {
                  const count = allPickleball.filter((r) => r.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setPbFilterCat(pbFilterCat === key ? "" : key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pbFilterCat === key ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              {(() => {
                const filteredPb = pbFilterCat ? allPickleball.filter((r) => r.category === pbFilterCat) : allPickleball;
                return filteredPb.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 bg-surface-50 rounded-xl border border-brand-100/30">No pickleball registrations found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredPb.map((reg) => (
                      <Card key={reg.id}>
                        <CardContent className="p-4">
                          {editingPb === reg.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {PB_LABELS[reg.category] || reg.category}
                                </span>
                                <Badge variant={reg.status === "APPROVED" ? "success" : "warning"} className="text-[10px]">
                                  {reg.status}
                                </Badge>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Player 1 Name</label>
                                  <input
                                    type="text"
                                    value={editP1}
                                    onChange={(e) => setEditP1(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-surface-50"
                                  />
                                </div>
                                {reg.category.includes("DOUBLES") && (
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Player 2 Name</label>
                                    <input
                                      type="text"
                                      value={editP2}
                                      onChange={(e) => setEditP2(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-surface-50"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" loading={actionLoading === reg.id}
                                  onClick={async () => {
                                    setActionLoading(reg.id);
                                    try {
                                      const body: Record<string, string> = { id: reg.id, action: "edit", player1Name: editP1 };
                                      if (reg.category.includes("DOUBLES")) body.player2Name = editP2;
                                      const res = await fetch("/api/admin/pickleball-pending", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(body),
                                      });
                                      if (!res.ok) throw new Error((await res.json()).error);
                                      toast("Player name updated!", "success");
                                      setEditingPb(null);
                                      fetchData();
                                    } catch (err) {
                                      toast(err instanceof Error ? err.message : "Failed", "error");
                                    } finally { setActionLoading(null); }
                                  }}
                                >Save</Button>
                                <button onClick={() => setEditingPb(null)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {PB_LABELS[reg.category] || reg.category}
                                  </span>
                                  <Badge variant={reg.status === "APPROVED" ? "success" : reg.status === "PENDING_APPROVAL" ? "warning" : "danger"} className="text-[10px]">
                                    {reg.status === "PENDING_APPROVAL" ? "PENDING" : reg.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                    {reg.player1Name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{reg.player1Name}</p>
                                    <p className="text-[11px] text-slate-400">{reg.player1Email}</p>
                                  </div>
                                </div>
                                {reg.player2Name && (
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                                      {reg.player2Name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-800">{reg.player2Name}</p>
                                      <p className="text-[11px] text-slate-400">{reg.player2Email}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <button
                                  className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                                  onClick={() => {
                                    setEditingPb(reg.id);
                                    setEditP1(reg.player1Name);
                                    setEditP2(reg.player2Name || "");
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                                  onClick={async () => {
                                    if (!confirm(`Remove ${reg.player1Name} from ${PB_LABELS[reg.category] || reg.category}?`)) return;
                                    setActionLoading(reg.id);
                                    try {
                                      const res = await fetch("/api/admin/pickleball-pending", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: reg.id, action: "delete" }),
                                      });
                                      if (!res.ok) throw new Error((await res.json()).error);
                                      toast("Registration removed.", "success");
                                      fetchData();
                                    } catch (err) {
                                      toast(err instanceof Error ? err.message : "Failed", "error");
                                    } finally { setActionLoading(null); }
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
