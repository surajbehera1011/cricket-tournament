export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [pendingTeams, pendingPlayers] = await Promise.all([
      prisma.team.findMany({
        where: { status: "PENDING_APPROVAL" },
        include: {
          _count: { select: { memberships: true } },
          memberships: {
            include: { player: { select: { id: true, fullName: true, gender: true, preferredRole: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.player.findMany({
        where: { poolStatus: "PENDING_APPROVAL" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return jsonResponse({
      teams: pendingTeams.map((t) => ({
        id: t.id,
        name: t.name,
        captainName: t.captainName,
        playerCount: t._count.memberships,
        players: t.memberships.map((m) => ({
          id: m.player.id,
          fullName: m.player.fullName,
          gender: m.player.gender,
          preferredRole: m.player.preferredRole,
        })),
        createdAt: t.createdAt,
      })),
      individuals: pendingPlayers.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        gender: p.gender,
        preferredRole: p.preferredRole,
        experienceLevel: p.experienceLevel,
        email: p.email,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get pending error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
