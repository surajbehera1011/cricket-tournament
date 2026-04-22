export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
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
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
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
        membershipType: m.membershipType,
        positionSlot: m.positionSlot,
        joinedAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get roster error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
