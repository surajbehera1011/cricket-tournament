import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        captain: { select: { id: true, displayName: true, email: true } },
        _count: { select: { memberships: true } },
        memberships: {
          include: {
            player: { select: { id: true, fullName: true, preferredRole: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = teams.map((t) => ({
      id: t.id,
      name: t.name,
      captain: t.captain,
      teamSize: t.teamSize,
      status: t.status,
      memberCount: t._count.memberships,
      slotsRemaining: Math.max(0, t.teamSize - t._count.memberships),
      players: t.memberships.map((m) => ({
        id: m.player.id,
        fullName: m.player.fullName,
        preferredRole: m.player.preferredRole,
        membershipType: m.membershipType,
        positionSlot: m.positionSlot,
      })),
      createdAt: t.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
