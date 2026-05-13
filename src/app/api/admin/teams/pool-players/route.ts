export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { jsonResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [players, settings] = await Promise.all([
      prisma.player.findMany({
        where: { poolStatus: PoolStatus.LOOKING_FOR_TEAM },
        select: {
          id: true,
          fullName: true,
          gender: true,
          preferredRole: true,
          experienceLevel: true,
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.tournamentSettings.findUnique({
        where: { id: "singleton" },
        select: {
          mandatoryPlayerCount: true,
          mandatoryFemaleCount: true,
          maxTeamSize: true,
        },
      }),
    ]);

    return jsonResponse({
      players,
      settings: settings ?? {
        mandatoryPlayerCount: 8,
        mandatoryFemaleCount: 1,
        maxTeamSize: 10,
      },
    });
  } catch (error) {
    console.error("Get pool players error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
