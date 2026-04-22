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

    const teams = await prisma.team.findMany({
      where: { status: { not: "PENDING_APPROVAL" } },
      include: {
        captain: { select: { id: true, displayName: true, email: true } },
        _count: { select: { memberships: true } },
        memberships: {
          include: {
            player: { select: { id: true, fullName: true, email: true, preferredRole: true, gender: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const staleIds: { id: string; correctStatus: TeamStatus }[] = [];

    const formatted = teams.map((t) => {
      const femaleCount = t.memberships.filter((m) => m.player.gender === "FEMALE").length;
      const effectiveSize = settings.maxTeamSize;
      const memberCount = t._count.memberships;

      const sizeOk = memberCount >= effectiveSize;
      const femaleOk = femaleCount >= settings.minFemalePerTeam;

      let displayStatus: TeamStatus = t.status;
      if (t.status === "READY") {
        displayStatus = "READY";
      } else {
        const computedStatus: TeamStatus = sizeOk && femaleOk ? "COMPLETE" : "INCOMPLETE";
        if (t.status !== computedStatus) {
          staleIds.push({ id: t.id, correctStatus: computedStatus });
        }
        displayStatus = computedStatus;
      }

      return {
        id: t.id,
        name: t.name,
        captainName: t.captainName || t.captain?.displayName || "",
        captain: t.captain,
        teamSize: effectiveSize,
        status: displayStatus,
        memberCount,
        femaleCount,
        minFemaleRequired: settings.minFemalePerTeam,
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
    });

    if (staleIds.length > 0) {
      Promise.all(
        staleIds.map(({ id, correctStatus }) =>
          prisma.team.update({ where: { id }, data: { status: correctStatus } })
        )
      ).catch((err) => console.error("Auto-heal status error:", err));
    }

    return jsonResponse(formatted);
  } catch (error) {
    console.error("Get teams error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
