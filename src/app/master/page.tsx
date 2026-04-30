"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface PickleballRegistration {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
  status: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  MENS_SINGLES: "Men's Singles",
  WOMENS_SINGLES: "Women's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

export default function MasterPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [registration, setRegistration] = useState<PickleballRegistration | null>(null);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/pickleball", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRegistration(data.registration || null);
      setTotalPending(data.totalPending || 0);
    } catch {
      toast("Failed to load registration", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNext();
  }, [fetchNext]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!registration) return;
    setActionLoading(action);
    try {
      const res = await fetch("/api/master/pickleball", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registration.id, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      toast(
        action === "approve" ? "Registration approved!" : "Registration rejected",
        action === "approve" ? "success" : "info"
      );
      await fetchNext();
    } catch (err: any) {
      toast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const isDoubles = registration?.category?.includes("DOUBLES");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Pickleball Approvals</h1>
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
        ) : !registration ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-5xl mb-4">&#127942;</div>
              <p className="text-white font-semibold text-lg mb-1">All caught up!</p>
              <p className="text-slate-400 text-sm">No pending pickleball registrations to review.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={fetchNext}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="warning">{totalPending} pending</Badge>
              <span className="text-xs text-slate-500">
                Registered {new Date(registration.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">
                  {CATEGORY_LABELS[registration.category] || registration.category}
                </CardTitle>
                <Badge variant="info">{isDoubles ? "Doubles" : "Singles"}</Badge>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">
                    Player 1
                  </p>
                  <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                    <p className="text-white font-medium">{registration.player1Name}</p>
                    <p className="text-slate-400 text-sm">{registration.player1Email}</p>
                  </div>
                </div>

                {isDoubles && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">
                      Player 2
                    </p>
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                      <p className="text-white font-medium">{registration.player2Name || "—"}</p>
                      <p className="text-slate-400 text-sm">{registration.player2Email || "—"}</p>
                    </div>
                  </div>
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
              After approving or rejecting, the next registration will load automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
