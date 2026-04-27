export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { jsonResponse } from "@/lib/api-utils";
import { getSettings } from "@/lib/business/registration";

export async function GET() {
  try {
    const settings = await getSettings();

    const includeBlock = {
      captain: { select: { id: true, displayName: true, email: true } },
      _count: { select: { memberships: true } },
      memberships: {
        include: {
          player: { select: { id: true, fullName: true, email: true, preferredRole: true, gender: true } },
        },
        orderBy: { createdAt: "asc" as const },
      },
    };

    const [teams, pendingTeams] = await Promise.all([
      prisma.team.findMany({
        where: { status: { not: "PENDING_APPROVAL" } },
        include: includeBlock,
        orderBy: { name: "asc" },
      }),
      prisma.team.findMany({
        where: { status: "PENDING_APPROVAL" },
        include: includeBlock,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const staleIds: { id: string; correctStatus: TeamStatus }[] = [];

    const formatted = teams.map((t) => {
      const femaleCount = t.memberships.filter((m) => m.player.gender === "FEMALE").length;
      const mandatoryCount = settings.mandatoryPlayerCount ?? 8;
      const minFemale = settings.mandatoryFemaleCount ?? 1;
      const maxAllowed = settings.maxTeamSize;
      const memberCount = t._count.memberships;

      const sizeOk = memberCount >= mandatoryCount;
      const femaleOk = femaleCount >= minFemale;
      const criteriaMet = sizeOk && femaleOk;

      let displayStatus: TeamStatus = t.status;

      // If team was submitted (COMPLETE) but criteria no longer met, revert
      if (t.status === "COMPLETE" && !criteriaMet) {
        staleIds.push({ id: t.id, correctStatus: "INCOMPLETE" as TeamStatus });
        displayStatus = "INCOMPLETE" as TeamStatus;
      }

      return {
        id: t.id,
        name: t.name,
        captainName: t.captainName || t.captain?.displayName || "",
        captain: t.captain,
        color: t.color || "",
        teamSize: maxAllowed,
        status: displayStatus,
        criteriaMet,
        memberCount,
        femaleCount,
        minFemaleRequired: minFemale,
        slotsRemaining: Math.max(0, maxAllowed - memberCount),
        players: t.memberships.map((m) => ({
          id: m.player.id,
          fullName: m.player.fullName,
          email: m.player.email || "",
          preferredRole: m.player.preferredRole,
          gender: m.player.gender,
          membershipType: m.membershipType,
          positionSlot: m.positionSlot,
        })),
        createdAt: t.createdAt,
      };
    });

    if (staleIds.length > 0) {
      Promise.all(
        staleIds.map(({ id, correctStatus }) =>
          prisma.team.update({ where: { id }, data: { status: correctStatus } })
        )
      ).catch((err) => console.error("Auto-heal status error:", err));
    }

    const formatTeam = (t: typeof teams[number]) => {
      const femaleCount = t.memberships.filter((m) => m.player.gender === "FEMALE").length;
      const effectiveSize = settings.maxTeamSize;
      const memberCount = t._count.memberships;
      return {
        id: t.id,
        name: t.name,
        captainName: t.captainName || t.captain?.displayName || "",
        captain: t.captain,
        color: t.color || "",
        teamSize: effectiveSize,
        status: t.status,
        memberCount,
        femaleCount,
        slotsRemaining: Math.max(0, effectiveSize - memberCount),
        players: t.memberships.map((m) => ({
          id: m.player.id,
          fullName: m.player.fullName,
          email: m.player.email || "",
          preferredRole: m.player.preferredRole,
          gender: m.player.gender,
          membershipType: m.membershipType,
          positionSlot: m.positionSlot,
        })),
        createdAt: t.createdAt,
      };
    };

    const pendingFormatted = pendingTeams.map(formatTeam);

    return jsonResponse({ teams: formatted, pendingTeams: pendingFormatted });
  } catch (error) {
    console.error("Get teams error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
