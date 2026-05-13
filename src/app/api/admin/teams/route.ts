export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamStatus, PoolStatus, MembershipType } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { getSettings } from "@/lib/business/registration";
import { sseManager } from "@/lib/sse";
import { jsonResponse } from "@/lib/api-utils";
import { z } from "zod";

const adminCreateTeamSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name must be at most 100 characters"),
  playerIds: z.array(z.string().uuid()).min(1, "At least one player is required"),
  captainPlayerId: z.string().uuid("Captain must be selected"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminCreateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teamName, playerIds, captainPlayerId } = parsed.data;

    // Verify captain is in the selected players
    if (!playerIds.includes(captainPlayerId)) {
      return NextResponse.json(
        { error: "Captain must be one of the selected players" },
        { status: 400 }
      );
    }

    // Fetch settings
    const settings = await getSettings();
    const mandatoryPlayerCount = settings.mandatoryPlayerCount;
    const mandatoryFemaleCount = settings.mandatoryFemaleCount;
    const maxTeamSize = settings.maxTeamSize;

    // Fetch players and verify pool status
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, fullName: true, gender: true, poolStatus: true },
    });

    // Check all players exist and are in the pool
    for (const pid of playerIds) {
      const player = players.find((p) => p.id === pid);
      if (!player) {
        return NextResponse.json(
          { error: `Player not found: ${pid}` },
          { status: 400 }
        );
      }
      if (player.poolStatus !== PoolStatus.LOOKING_FOR_TEAM) {
        return NextResponse.json(
          { error: `Player ${player.fullName} is not available in the pool` },
          { status: 400 }
        );
      }
    }

    // Validate composition rules
    if (playerIds.length < mandatoryPlayerCount) {
      return NextResponse.json(
        { error: `At least ${mandatoryPlayerCount} players are required` },
        { status: 400 }
      );
    }

    const femaleCount = players.filter((p) => p.gender === "FEMALE").length;
    if (femaleCount < mandatoryFemaleCount) {
      return NextResponse.json(
        { error: `At least ${mandatoryFemaleCount} female player(s) required` },
        { status: 400 }
      );
    }

    if (playerIds.length > maxTeamSize) {
      return NextResponse.json(
        { error: `Maximum ${maxTeamSize} players allowed` },
        { status: 400 }
      );
    }

    // Check team name uniqueness
    const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });
    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 }
      );
    }

    // Atomic transaction: create team, memberships, update player statuses
    const captainPlayer = players.find((p) => p.id === captainPlayerId);
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: teamName,
          status: TeamStatus.COMPLETE,
          teamSize: maxTeamSize,
          captainName: captainPlayer?.fullName || "",
        },
      });

      for (let i = 0; i < playerIds.length; i++) {
        const isCaptain = playerIds[i] === captainPlayerId;
        await tx.teamMembership.create({
          data: {
            teamId: newTeam.id,
            playerId: playerIds[i],
            membershipType: MembershipType.DRAFT_PICK,
            positionSlot: isCaptain ? "Captain" : `Player ${i + 1}`,
          },
        });

        await tx.player.update({
          where: { id: playerIds[i] },
          data: { poolStatus: PoolStatus.ASSIGNED },
        });
      }

      return newTeam;
    }, { maxWait: 10000, timeout: 30000 });

    // Audit log
    await createAuditLog({
      actorUserId: session.user.id,
      action: "CREATE_TEAM",
      entityType: "Team",
      entityId: team.id,
      after: { teamName, playerIds },
    });

    // SSE broadcast
    sseManager.broadcast({
      type: "team-updated",
      data: { teamId: team.id, teamName },
    });

    return jsonResponse(
      {
        team: {
          id: team.id,
          name: team.name,
          status: team.status,
          memberCount: playerIds.length,
        },
      },
      201
    );
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
