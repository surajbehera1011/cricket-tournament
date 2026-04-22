export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/business/audit";
import { recomputeTeamStatus } from "@/lib/business/registration";
import { z } from "zod";

const approveSchema = z.object({
  teamId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.status === "PENDING_APPROVAL") {
      await prisma.team.update({
        where: { id: team.id },
        data: { status: "INCOMPLETE" },
      });
      await recomputeTeamStatus(team.id);
    } else if (team.status === "COMPLETE") {
      await prisma.team.update({
        where: { id: team.id },
        data: { status: "READY" },
      });
    } else {
      return NextResponse.json({ error: `Cannot approve team with status ${team.status}` }, { status: 400 });
    }

    const updated = await prisma.team.findUnique({ where: { id: team.id } });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "APPROVE_TEAM",
      entityType: "Team",
      entityId: team.id,
      before: { status: team.status },
      after: { status: updated?.status },
    });

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
