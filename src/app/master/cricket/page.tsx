"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TeamPlayer {
  id: string;
  fullName: string;
  email: string;
  gender: string | null;
  membershipType: string;
}

interface TeamItem {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  players: TeamPlayer[];
}

interface IndividualItem {
  id: string;
  fullName: string;
  email: string;
  gender: string | null;
  preferredRole: string | null;
  experienceLevel: string | null;
  createdAt: string;
}

type PendingData =
  | { type: "team"; item: TeamItem; totalPending: number }
  | { type: "individual"; item: IndividualItem; totalPending: number }
  | { type: null; item: null; totalPending: number };

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default function CricketMasterPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/cricket", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast("Failed to load pending items", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNext();
  }, [fetchNext]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!data?.item || !data.type) return;
    setActionLoading(action);
    try {
      const res = await fetch("/api/master/cricket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: data.type, id: data.item.id, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      const label = data.type === "team" ? "Team" : "Player";
      toast(
        action === "approve" ? `${label} approved!` : `${label} rejected`,
        action === "approve" ? "success" : "info"
      );
      await fetchNext();
    } catch (err: any) {
      toast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Cricket Approvals</h1>
          <p className="text-sm text-slate-400">
            {session?.user?.name ? `Welcome, ${session.user.name}` : "Review registrations one at a time"}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-pitch-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Loading...</p>
            </CardContent>
          </Card>
        ) : !data?.item ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-5xl mb-4">&#127942;</div>
              <p className="text-white font-semibold text-lg mb-1">All caught up!</p>
              <p className="text-slate-400 text-sm">No pending cricket registrations to review.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={fetchNext}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="warning">{data.totalPending} pending</Badge>
              <span className="text-xs text-slate-500">
                Registered {formatDate(data.item.createdAt)}
              </span>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">
                  {data.type === "team"
                    ? (data.item as TeamItem).name
                    : (data.item as IndividualItem).fullName}
                </CardTitle>
                <Badge variant={data.type === "team" ? "info" : "default"}>
                  {data.type === "team" ? "Team" : "Individual"}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-5">
                {data.type === "team" && (
                  <>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">
                        Players ({(data.item as TeamItem).players.length})
                      </p>
                      <div className="space-y-2">
                        {(data.item as TeamItem).players.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-white font-medium">{p.fullName}</p>
                              <div className="flex items-center gap-2">
                                {p.gender && (
                                  <span className="text-[10px] text-slate-500 uppercase">{p.gender}</span>
                                )}
                                {p.membershipType === "CAPTAIN" && (
                                  <Badge variant="warning">Captain</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-400 text-sm">{p.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {data.type === "individual" && (
                  <>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">
                        Player Details
                      </p>
                      <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">
                            {(data.item as IndividualItem).fullName}
                          </p>
                          {(data.item as IndividualItem).gender && (
                            <span className="text-[10px] text-slate-500 uppercase">
                              {(data.item as IndividualItem).gender}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {(data.item as IndividualItem).email}
                        </p>
                        <div className="flex gap-3 pt-1">
                          {(data.item as IndividualItem).preferredRole && (
                            <span className="text-xs text-slate-400">
                              Role: {(data.item as IndividualItem).preferredRole}
                            </span>
                          )}
                          {(data.item as IndividualItem).experienceLevel && (
                            <span className="text-xs text-slate-400">
                              Experience:{" "}
                              {EXPERIENCE_LABELS[(data.item as IndividualItem).experienceLevel!] ||
                                (data.item as IndividualItem).experienceLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    loading={actionLoading === "approve"}
                    disabled={!!actionLoading}
                    onClick={() => handleAction("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    className="flex-1"
                    loading={actionLoading === "reject"}
                    disabled={!!actionLoading}
                    onClick={() => handleAction("reject")}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-slate-500 mt-4">
              After approving or rejecting, the next item will load automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
