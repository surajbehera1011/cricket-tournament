export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";
import { getSettings } from "@/lib/business/registration";

export async function GET() {
  try {
    const settings = await getSettings();

    const teams = await prisma.team.findMany({
      include: {
        captain: { select: { id: true, displayName: true, email: true } },
        _count: { select: { memberships: true } },
        memberships: {
          include: {
            player: { select: { id: true, fullName: true, preferredRole: true, gender: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = teams.map((t) => {
      const femaleCount = t.memberships.filter((m) => m.player.gender === "FEMALE").length;
      const effectiveSize = settings.maxTeamSize;
      return {
        id: t.id,
        name: t.name,
        captain: t.captain,
        teamSize: effectiveSize,
        status: t.status,
        memberCount: t._count.memberships,
        femaleCount,
        minFemaleRequired: settings.minFemalePerTeam,
        slotsRemaining: Math.max(0, effectiveSize - t._count.memberships),
        players: t.memberships.map((m) => ({
          id: m.player.id,
          fullName: m.player.fullName,
          preferredRole: m.player.preferredRole,
          gender: m.player.gender,
          membershipType: m.membershipType,
          positionSlot: m.positionSlot,
        })),
        createdAt: t.createdAt,
      };
    });

    return jsonResponse(formatted);
  } catch (error) {
    console.error("Get teams error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
