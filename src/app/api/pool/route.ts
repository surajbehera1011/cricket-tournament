export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";

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

    const players = await prisma.player.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Get pool error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
