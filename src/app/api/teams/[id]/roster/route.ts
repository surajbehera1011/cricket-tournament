export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        captain: { select: { id: true, displayName: true, email: true } },
        memberships: {
          include: {
            player: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!team) {
      return jsonResponse({ error: "Team not found" }, 404);
    }

    return jsonResponse({
      id: team.id,
      name: team.name,
      captain: team.captain,
      teamSize: team.teamSize,
      status: team.status,
      roster: team.memberships.map((m) => ({
        playerId: m.player.id,
        fullName: m.player.fullName,
        preferredRole: m.player.preferredRole,
        experienceLevel: m.player.experienceLevel,
        gender: m.player.gender,
        membershipType: m.membershipType,
        positionSlot: m.positionSlot,
        joinedAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get roster error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
