export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { recomputeTeamStatus } from "@/lib/business/registration";
import {
  sendTeamApprovedEmail,
  sendTeamRejectedEmail,
  sendIndividualApprovedEmail,
} from "@/lib/email";
import { autoRegenerateCricketFixture } from "@/lib/fixture-auto-regen";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";
import { decryptEmail } from "@/lib/crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [pendingTeamCount, pendingIndividualCount] = await Promise.all([
      prisma.team.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.player.count({ where: { poolStatus: PoolStatus.PENDING_APPROVAL } }),
    ]);

    const totalPending = pendingTeamCount + pendingIndividualCount;

    const pendingTeam = await prisma.team.findFirst({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "asc" },
      include: {
        memberships: {
          include: {
            player: {
              select: { id: true, fullName: true, email: true, gender: true },
            },
          },
        },
      },
    });

    if (pendingTeam) {
      return NextResponse.json({
        type: "team" as const,
        item: {
          id: pendingTeam.id,
          name: pendingTeam.name,
          color: pendingTeam.color,
          createdAt: pendingTeam.createdAt,
          players: pendingTeam.memberships.map((m) => ({
            id: m.player.id,
            fullName: m.player.fullName,
            email: decryptEmail(m.player.email) || "",
            gender: m.player.gender,
            membershipType: m.membershipType,
          })),
        },
        totalPending,
      });
    }

    const pendingIndividual = await prisma.player.findFirst({
      where: { poolStatus: PoolStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "asc" },
    });

    if (pendingIndividual) {
      return NextResponse.json({
        type: "individual" as const,
        item: {
          id: pendingIndividual.id,
          fullName: pendingIndividual.fullName,
          email: decryptEmail(pendingIndividual.email) || "",
          gender: pendingIndividual.gender,
          preferredRole: pendingIndividual.preferredRole,
          experienceLevel: pendingIndividual.experienceLevel,
          createdAt: pendingIndividual.createdAt,
        },
        totalPending,
      });
    }

    return NextResponse.json({ type: null, item: null, totalPending: 0 });
  } catch (error) {
    console.error("Master cricket GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, id, action } = await request.json();

    if (!id || !type || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (type === "team") {
      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          memberships: {
            include: { player: { select: { email: true } } },
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.status !== "PENDING_APPROVAL") {
        return NextResponse.json({ error: "Team already processed" }, { status: 400 });
      }

      if (action === "approve") {
        await prisma.team.update({
          where: { id: team.id },
          data: { status: "INCOMPLETE" },
        });
        await recomputeTeamStatus(team.id);

        const updated = await prisma.team.findUnique({ where: { id: team.id } });

        await createAuditLog({
          actorUserId: session.user.id,
          action: "APPROVE_TEAM",
          entityType: "Team",
          entityId: team.id,
          before: { status: "PENDING_APPROVAL" },
          after: { status: updated?.status },
        });

        const allEmails = team.memberships
          .map((m) => decryptEmail(m.player.email))
          .filter(Boolean) as string[];

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
          message: `Team "${team.name}" approved → ${updated?.status}. By ${session.user.name || "master"}.`,
          link: "/master/cricket",
        }).catch(() => {});

        return NextResponse.json({ message: "Team approved" });
      }

      if (action === "reject") {
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

        const allEmails = team.memberships
          .map((m) => decryptEmail(m.player?.email))
          .filter(Boolean) as string[];

        if (allEmails.length > 0) {
          sendTeamRejectedEmail(allEmails, team.name);
        }

        notifyAllAdmins({
          title: "Team Rejected",
          message: `Team "${team.name}" (PENDING) was rejected and deleted. By ${session.user.name || "master"}.`,
          link: "/master/cricket",
        }).catch(() => {});

        return NextResponse.json({ message: "Team rejected" });
      }
    }

    if (type === "individual") {
      const player = await prisma.player.findUnique({ where: { id } });

      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 });
      }

      if (player.poolStatus !== PoolStatus.PENDING_APPROVAL) {
        return NextResponse.json({ error: "Player already processed" }, { status: 400 });
      }

      if (action === "approve") {
        const updated = await prisma.player.update({
          where: { id },
          data: { poolStatus: PoolStatus.LOOKING_FOR_TEAM },
        });

        await createAuditLog({
          actorUserId: session.user.id,
          action: "APPROVE_INDIVIDUAL",
          entityType: "Player",
          entityId: id,
          before: { poolStatus: "PENDING_APPROVAL" },
          after: { poolStatus: "LOOKING_FOR_TEAM" },
        });

        if (updated.email) {
          sendIndividualApprovedEmail(updated.fullName, decryptEmail(updated.email)!);
        }

        notifyAllAdmins({
          title: "Individual Player Approved",
          message: `${updated.fullName} approved and moved to the player pool. By ${session.user.name || "master"}.`,
          link: "/master/cricket",
        }).catch(() => {});

        return NextResponse.json({ message: "Player approved" });
      }

      if (action === "reject") {
        await prisma.player.delete({ where: { id } });

        await createAuditLog({
          actorUserId: session.user.id,
          action: "REJECT_INDIVIDUAL",
          entityType: "Player",
          entityId: id,
          before: { poolStatus: "PENDING_APPROVAL" },
          after: { deleted: true },
        });

        notifyAllAdmins({
          title: "Individual Player Rejected",
          message: `Individual player "${player.fullName}" was rejected. By ${session.user.name || "master"}.`,
          link: "/master/cricket",
        }).catch(() => {});

        return NextResponse.json({ message: "Player rejected" });
      }
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Master cricket POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
