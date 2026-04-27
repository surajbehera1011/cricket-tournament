export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { z } from "zod";
import { sendTeamRejectedEmail, sendRosterRejectedEmail } from "@/lib/email";

const rejectSchema = z.object({
  teamId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  playerIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    if (parsed.data.playerId) {
      await prisma.player.delete({ where: { id: parsed.data.playerId } });

      await createAuditLog({
        actorUserId: session.user.id,
        action: "REJECT_INDIVIDUAL",
        entityType: "Player",
        entityId: parsed.data.playerId,
        before: { poolStatus: "PENDING_APPROVAL" },
        after: { deleted: true },
      });

      return NextResponse.json({ success: true });
    }

    if (parsed.data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: parsed.data.teamId },
        include: {
          memberships: {
            include: { player: { select: { email: true } } },
          },
        },
      });
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.status === "PENDING_APPROVAL") {
        await prisma.$transaction(async (tx) => {
          await tx.teamMembership.deleteMany({ where: { teamId: team.id } });
          const playerIds = team.memberships.map((m) => m.playerId);
          await tx.player.deleteMany({ where: { id: { in: playerIds } } });
          await tx.team.delete({ where: { id: team.id } });
        });

        await createAuditLog({
          actorUserId: session.user.id,
          action: "REJECT_TEAM",
          entityType: "Team",
          entityId: team.id,
          before: { name: team.name, status: "PENDING_APPROVAL" },
          after: { deleted: true },
        });

        const allEmailsPending = team.memberships.map((m) => m.player?.email).filter(Boolean) as string[];
        if (allEmailsPending.length > 0) {
          sendTeamRejectedEmail(allEmailsPending, team.name);
        }
      } else if (team.status === "COMPLETE" && parsed.data.playerIds?.length) {
        await prisma.$transaction(async (tx) => {
          for (const pid of parsed.data.playerIds!) {
            await tx.teamMembership.deleteMany({ where: { teamId: team.id, playerId: pid } });
            await tx.player.update({ where: { id: pid }, data: { poolStatus: PoolStatus.LOOKING_FOR_TEAM } });
          }
          await tx.team.update({ where: { id: team.id }, data: { status: "INCOMPLETE" } });
        });

        await createAuditLog({
          actorUserId: session.user.id,
          action: "REJECT_TEAM",
          entityType: "Team",
          entityId: team.id,
          before: { status: "COMPLETE" },
          after: { status: "INCOMPLETE", movedToPool: parsed.data.playerIds },
        });

        const allEmailsRoster = team.memberships.map((m) => m.player?.email).filter(Boolean) as string[];
        if (allEmailsRoster.length > 0) {
          sendRosterRejectedEmail(allEmailsRoster, team.name, parsed.data.playerIds!.length);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide teamId or playerId" }, { status: 400 });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
