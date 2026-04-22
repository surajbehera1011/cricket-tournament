import { prisma } from "@/lib/prisma";
import { PoolStatus, MembershipType, AuditAction, UserRole } from "@prisma/client";
import { createAuditLog } from "./audit";
import { recomputeTeamStatus } from "./registration";
import { sseManager } from "@/lib/sse";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

export async function assignPlayerToTeam(
  teamId: string,
  playerId: string,
  actorUserId: string,
  actorRole: UserRole
) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { captain: true },
  });
  if (!team) throw new BusinessError("Team not found");

  if (team.status === "COMPLETE") {
    throw new BusinessError("Team is complete and frozen. No changes allowed.");
  }

  if (actorRole === UserRole.CAPTAIN && team.captainUserId !== actorUserId) {
    throw new AuthorizationError("Captains can only assign players to their own team");
  }
  if (actorRole === UserRole.VIEWER) {
    throw new AuthorizationError("Viewers cannot assign players");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new BusinessError("Player not found");

  const existingMembership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });
  if (existingMembership) {
    throw new BusinessError("Player is already on this team");
  }

  const otherMembership = await prisma.teamMembership.findFirst({
    where: { playerId },
  });

  const result = await prisma.$transaction(async (tx) => {
    let previousTeamId: string | null = null;

    if (otherMembership) {
      previousTeamId = otherMembership.teamId;
      await tx.teamMembership.delete({
        where: { id: otherMembership.id },
      });
    }

    const membership = await tx.teamMembership.create({
      data: {
        teamId,
        playerId,
        membershipType: MembershipType.DRAFT_PICK,
      },
    });

    await tx.player.update({
      where: { id: playerId },
      data: { poolStatus: PoolStatus.ASSIGNED },
    });

    return { membership, previousTeamId };
  });

  await recomputeTeamStatus(teamId);
  if (result.previousTeamId) {
    await recomputeTeamStatus(result.previousTeamId);
  }

  await createAuditLog({
    actorUserId,
    action: AuditAction.ASSIGN_PLAYER,
    entityType: "TeamMembership",
    entityId: result.membership.id,
    before: otherMembership
      ? { teamId: otherMembership.teamId, playerId }
      : { poolStatus: player.poolStatus },
    after: { teamId, playerId, membershipType: "DRAFT_PICK" },
  });

  sseManager.broadcast({
    type: "player-assigned",
    data: { teamId, playerId, playerName: player.fullName },
  });

  return result.membership;
}

export async function removePlayerFromTeam(
  teamId: string,
  playerId: string,
  actorUserId: string,
  actorRole: UserRole
) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new BusinessError("Team not found");

  if (team.status === "COMPLETE") {
    throw new BusinessError("Team is complete and frozen. No changes allowed.");
  }

  if (actorRole === UserRole.CAPTAIN && team.captainUserId !== actorUserId) {
    throw new AuthorizationError("Captains can only remove players from their own team");
  }
  if (actorRole === UserRole.VIEWER) {
    throw new AuthorizationError("Viewers cannot remove players");
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
    include: { player: true },
  });
  if (!membership) {
    throw new BusinessError("Player is not on this team");
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamMembership.delete({
      where: { id: membership.id },
    });

    await tx.player.update({
      where: { id: playerId },
      data: { poolStatus: PoolStatus.LOOKING_FOR_TEAM },
    });
  });

  await recomputeTeamStatus(teamId);

  await createAuditLog({
    actorUserId,
    action: AuditAction.REMOVE_PLAYER,
    entityType: "TeamMembership",
    entityId: membership.id,
    before: { teamId, playerId, membershipType: membership.membershipType },
    after: { poolStatus: "LOOKING_FOR_TEAM" },
  });

  sseManager.broadcast({
    type: "player-removed",
    data: { teamId, playerId, playerName: membership.player.fullName },
  });

  return { success: true };
}
