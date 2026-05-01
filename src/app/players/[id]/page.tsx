"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface PlayerProfile {
  id: string;
  fullName: string;
  email: string | null;
  gender: string;
  preferredRole: string;
  experienceLevel: string;
  poolStatus: string;
  createdAt: string;
  teams: {
    teamId: string;
    teamName: string;
    teamColor: string;
    teamStatus: string;
    membershipType: string;
    positionSlot: string | null;
  }[];
}

const genderLabel: Record<string, string> = { MALE: "Male", FEMALE: "Female" };
const poolLabel: Record<string, { text: string; variant: "success" | "warning" | "info" | "danger" | "default" }> = {
  LOOKING_FOR_TEAM: { text: "Looking for Team", variant: "info" },
  ASSIGNED: { text: "Assigned", variant: "success" },
  PENDING_APPROVAL: { text: "Pending Approval", variant: "warning" },
  NONE: { text: "On Team", variant: "default" },
};

export default function PlayerProfilePage() {
  const params = useParams();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/players/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Player not found");
        return res.json();
      })
      .then(setPlayer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-24 w-24 rounded-full bg-white/[0.06] mx-auto mb-4" />
        <div className="h-6 w-48 bg-white/[0.04] rounded mx-auto mb-8" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white/[0.03] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Player Not Found</h1>
        <p className="text-slate-400 mb-6">{error || "This player doesn't exist."}</p>
        <Link href="/manage" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
          Back to Team Management
        </Link>
      </div>
    );
  }

  const initials = player.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const genderColor =
    player.gender === "FEMALE" ? "from-pink-500 to-rose-500" :
    "from-sky-500 to-blue-500";

  const ps = poolLabel[player.poolStatus] || poolLabel.NONE;
  const roles = player.preferredRole ? player.preferredRole.split(",").map((r) => r.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/manage" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Teams
      </Link>

      <div className="dark-card rounded-2xl overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${genderColor} opacity-30`} />
        <div className="px-6 pb-6 -mt-12 relative">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${genderColor} flex items-center justify-center text-white text-2xl font-bold border-4 border-dark-600 shadow-xl`}>
            {initials}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white">{player.fullName}</h1>
            {player.email && (
              <p className="text-sm text-slate-400 mt-0.5">{player.email}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={ps.variant}>{ps.text}</Badge>
              <Badge variant="default">{genderLabel[player.gender] || player.gender}</Badge>
              {player.experienceLevel && (
                <Badge
                  variant={
                    player.experienceLevel === "Advanced" ? "success" :
                    player.experienceLevel === "Intermediate" ? "warning" : "default"
                  }
                >
                  {player.experienceLevel}
                </Badge>
              )}
            </div>
          </div>

          {roles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preferred Roles</h3>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span key={role} className="text-sm px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {player.teams.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Teams</h3>
              <div className="space-y-2">
                {player.teams.map((t) => (
                  <div key={t.teamId} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: t.teamColor || "#6366f1" }}
                      >
                        {t.teamName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.teamName}</p>
                        <p className="text-[11px] text-slate-500">
                          {t.positionSlot || "Player"} &middot; {t.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft Pick"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={t.teamStatus === "READY" ? "success" : t.teamStatus === "COMPLETE" ? "info" : "warning"}>
                      {t.teamStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500">
              Registered on {new Date(player.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
