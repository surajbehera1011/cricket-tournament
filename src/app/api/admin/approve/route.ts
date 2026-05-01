export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/business/audit";
import { recomputeTeamStatus } from "@/lib/business/registration";
import { z } from "zod";
import { sendTeamApprovedEmail } from "@/lib/email";
import { autoRegenerateCricketFixture } from "@/lib/fixture-auto-regen";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

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

    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      include: {
        memberships: {
          select: { player: { select: { email: true } } },
        },
      },
    });
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

    const allEmails = team.memberships.map((m) => m.player.email).filter(Boolean) as string[];
    if (allEmails.length > 0 && updated) {
      sendTeamApprovedEmail(allEmails, team.name, updated.status);
    }

    if (updated?.status === "READY") {
      autoRegenerateCricketFixture();
    }

    if (team.captainUserId) {
      createNotification({
        userId: team.captainUserId,
        title: "Team Approved!",
        message: `Your team "${team.name}" has been approved and is ${updated?.status === "READY" ? "ready for the tournament" : "now active"}.`,
        link: "/manage",
      }).catch(() => {});
    }

    notifyAllAdmins({
      title: "Team Approved",
      message: `Team "${team.name}" approved → ${updated?.status}. By ${session.user.name || "admin"}.`,
      link: "/manage",
    }).catch(() => {});

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
