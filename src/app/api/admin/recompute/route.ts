export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { getSettings } from "@/lib/business/registration";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getSettings();

    const teams = await prisma.team.findMany({
      include: {
        memberships: {
          include: { player: { select: { gender: true } } },
        },
      },
    });

    let fixed = 0;

    for (const team of teams) {
      const memberCount = team.memberships.length;
      const femaleCount = team.memberships.filter((m) => m.player.gender === "FEMALE").length;
      const sizeOk = memberCount >= settings.maxTeamSize;
      const femaleOk = femaleCount >= settings.minFemalePerTeam;
      const correctStatus: TeamStatus = sizeOk && femaleOk ? "COMPLETE" : "INCOMPLETE";

      if (team.status !== correctStatus || team.teamSize !== settings.maxTeamSize) {
        await prisma.team.update({
          where: { id: team.id },
          data: { status: correctStatus, teamSize: settings.maxTeamSize },
        });
        fixed++;
      }
    }

    return NextResponse.json({ count: teams.length, fixed });
  } catch (error) {
    console.error("Recompute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
