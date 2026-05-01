import { prisma } from "@/lib/prisma";
import { PoolStatus, MembershipType, AuditAction, UserRole } from "@prisma/client";
import { createAuditLog } from "./audit";
import { recomputeTeamStatus } from "./registration";
import { sseManager } from "@/lib/sse";
import { sendPlayerDraftedEmail, sendPlayerRemovedEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";

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
  actorRole: UserRole,
  slotType: "mandatory" | "extra" = "mandatory"
) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      captain: true,
      memberships: { include: { player: { select: { gender: true } } } },
    },
  });
  if (!team) throw new BusinessError("Team not found");

  if (team.status === "READY") {
    throw new BusinessError("Team is frozen (READY). No changes allowed.");
  }

  if (actorRole === UserRole.CAPTAIN && team.captainUserId !== actorUserId) {
    throw new AuthorizationError("Captains can only assign players to their own team");
  }
  if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.CAPTAIN) {
    throw new AuthorizationError("Only admins and captains can assign players");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new BusinessError("Player not found");

  const existingMembership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });
  if (existingMembership) {
    throw new BusinessError("Player is already on this team");
  }

  const MANDATORY_LIMIT = 8;
  const EXTRA_LIMIT = 2;

  const currentMandatory = team.memberships.filter(
    (m) => !m.positionSlot?.startsWith("Extra")
  );
  const currentExtra = team.memberships.filter(
    (m) => m.positionSlot?.startsWith("Extra")
  );

  let positionSlot: string;

  if (slotType === "mandatory") {
    if (currentMandatory.length >= MANDATORY_LIMIT) {
      throw new BusinessError(`Mandatory slots full (${MANDATORY_LIMIT}/${MANDATORY_LIMIT}). Use an extra slot instead.`);
    }
    const mandatoryFemales = currentMandatory.filter((m) => m.player.gender === "FEMALE").length;
    if (
      currentMandatory.length === MANDATORY_LIMIT - 1 &&
      mandatoryFemales < 1 &&
      player.gender !== "FEMALE"
    ) {
      throw new BusinessError("Last mandatory slot must be a female player (at least 1 female required).");
    }
    positionSlot = `Player ${currentMandatory.length + 1}`;
  } else {
    if (currentExtra.length >= EXTRA_LIMIT) {
      throw new BusinessError(`Extra slots full (${EXTRA_LIMIT}/${EXTRA_LIMIT}).`);
    }
    const extraMales = currentExtra.filter((m) => m.player.gender === "MALE").length;
    if (player.gender === "MALE" && extraMales >= 1) {
      throw new BusinessError("Extra slots can have at most 1 male. This player is male and there is already 1 male in extra.");
    }
    positionSlot = `Extra ${currentExtra.length + 1}`;
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
        positionSlot,
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

  if (player.email) {
    sendPlayerDraftedEmail(player.fullName, player.email, team.name, slotType);
  }

  notifyAllAdmins({
    title: "Player Assigned to Team",
    message: `${player.fullName} assigned to "${team.name}" as ${slotType}.`,
    link: "/manage",
  }).catch(() => {});

  return result.membership;
}

export async function removePlayerFromTeam(
  teamId: string,
  playerId: string,
  actorUserId: string,
  actorRole: UserRole
) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true, status: true, captainUserId: true } });
  if (!team) throw new BusinessError("Team not found");

  if (team.status === "READY") {
    throw new BusinessError("Team is frozen (READY). No changes allowed.");
  }

  if (actorRole === UserRole.CAPTAIN && team.captainUserId !== actorUserId) {
    throw new AuthorizationError("Captains can only remove players from their own team");
  }
  if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.CAPTAIN) {
    throw new AuthorizationError("Only admins and captains can remove players");
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
    include: { player: true },
  });
  if (!membership) {
    throw new BusinessError("Player is not on this team");
  }

  if (actorRole === UserRole.CAPTAIN && membership.membershipType === MembershipType.TEAM_SUBMISSION) {
    throw new AuthorizationError("Captains cannot remove original players. Only admins can.");
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

  if (membership.player.email) {
    sendPlayerRemovedEmail(membership.player.fullName, membership.player.email, team.name);
  }

  notifyAllAdmins({
    title: "Player Removed from Team",
    message: `${membership.player.fullName} removed from "${team.name}" and returned to pool.`,
    link: "/manage",
  }).catch(() => {});

  return { success: true };
}
