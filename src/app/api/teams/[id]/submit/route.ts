export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/business/registration";
import { createAuditLog } from "@/lib/business/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        memberships: { include: { player: { select: { gender: true } } } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (session.user.role === "CAPTAIN" && team.captainUserId !== session.user.id) {
      return NextResponse.json({ error: "You can only submit your own team" }, { status: 403 });
    }

    if (team.status !== "INCOMPLETE") {
      return NextResponse.json(
        { error: `Cannot submit team with status ${team.status}` },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const memberCount = team.memberships.length;
    const femaleCount = team.memberships.filter((m) => m.player.gender === "FEMALE").length;
    const sizeOk = memberCount >= settings.maxTeamSize;
    const femaleOk = femaleCount >= settings.minFemalePerTeam;

    if (!sizeOk || !femaleOk) {
      const reasons = [];
      if (!sizeOk) reasons.push(`Need ${settings.maxTeamSize} players (have ${memberCount})`);
      if (!femaleOk) reasons.push(`Need ${settings.minFemalePerTeam} female player(s) (have ${femaleCount})`);
      return NextResponse.json(
        { error: `Team does not meet criteria: ${reasons.join(". ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: { status: "COMPLETE" },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "MARK_COMPLETE",
      entityType: "Team",
      entityId: team.id,
      before: { status: team.status },
      after: { status: "COMPLETE" },
    });

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Submit team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
