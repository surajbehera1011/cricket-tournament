export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { jsonResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const experience = searchParams.get("experience");

    const where: Record<string, unknown> = {
      poolStatus: PoolStatus.LOOKING_FOR_TEAM,
    };

    if (role) {
      where.preferredRole = { contains: role, mode: "insensitive" };
    }
    if (experience) {
      where.experienceLevel = experience;
    }

    const [players, pendingPlayers] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.player.findMany({
        where: { poolStatus: PoolStatus.PENDING_APPROVAL },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return jsonResponse({ players, pendingPlayers });
  } catch (error) {
    console.error("Get pool error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
