import { prisma } from "@/lib/prisma";
import { TeamStatus, PoolStatus, MembershipType, AuditAction, Prisma } from "@prisma/client";
import { createAuditLog } from "./audit";
import { sseManager } from "@/lib/sse";
import type { TeamRegistrationInput, IndividualRegistrationInput } from "@/lib/validators";

export async function recomputeTeamStatus(teamId: string): Promise<TeamStatus> {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: { _count: { select: { memberships: true } } },
  });

  const newStatus =
    team._count.memberships >= team.teamSize ? TeamStatus.COMPLETE : TeamStatus.INCOMPLETE;

  if (team.status !== newStatus) {
    await prisma.team.update({
      where: { id: teamId },
      data: { status: newStatus },
    });
  }

  return newStatus;
}

export async function registerTeam(
  input: TeamRegistrationInput,
  actorUserId: string
) {
  const playerNames = [
    input.player1,
    input.player2,
    input.player3,
    input.player4,
    input.player5,
    input.player6,
    input.player7,
    input.player8,
    input.player9,
  ].filter((name) => name && name.trim() !== "");

  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.upsert({
      where: { name: input.teamName },
      update: {
        teamSize: input.teamSize,
      },
      create: {
        name: input.teamName,
        teamSize: input.teamSize,
        status: TeamStatus.INCOMPLETE,
      },
    });

    const players = [];
    for (let i = 0; i < playerNames.length; i++) {
      const player = await tx.player.create({
        data: {
          fullName: playerNames[i],
          preferredRole: "",
          experienceLevel: "",
          poolStatus: PoolStatus.ASSIGNED,
        },
      });
      players.push(player);

      await tx.teamMembership.create({
        data: {
          teamId: team.id,
          playerId: player.id,
          membershipType: MembershipType.TEAM_SUBMISSION,
          positionSlot: `Player ${i + 1}`,
        },
      });
    }

    const registration = await tx.registration.create({
      data: {
        registrationType: "TEAM",
        submitterEmail: input.submitterEmail,
        submitterName: input.submitterName,
        teamName: input.teamName,
        captainName: input.captainName,
        teamSize: input.teamSize,
        teamPlayersJson: playerNames.reduce<Record<string, string>>(
          (acc, name, idx) => ({ ...acc, [`Player${idx + 1}`]: name }),
          {}
        ) as Prisma.InputJsonValue,
        comments: input.comments,
        poolStatus: PoolStatus.NONE,
      },
    });

    const memberCount = await tx.teamMembership.count({
      where: { teamId: team.id },
    });
    const newStatus =
      memberCount >= team.teamSize ? TeamStatus.COMPLETE : TeamStatus.INCOMPLETE;

    const updatedTeam = await tx.team.update({
      where: { id: team.id },
      data: { status: newStatus },
    });

    return { team: updatedTeam, players, registration };
  });

  await createAuditLog({
    actorUserId,
    action: AuditAction.REGISTER_TEAM,
    entityType: "Team",
    entityId: result.team.id,
    after: {
      teamName: input.teamName,
      captainName: input.captainName,
      teamSize: input.teamSize,
      playerCount: playerNames.length,
    },
  });

  sseManager.broadcast({
    type: "registration-created",
    data: { teamId: result.team.id, teamName: input.teamName },
  });

  return result;
}

export async function registerIndividual(
  input: IndividualRegistrationInput,
  actorUserId: string
) {
  const result = await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: {
        fullName: input.fullName,
        email: input.email || null,
        preferredRole: input.preferredRole.join(", "),
        experienceLevel: input.experienceLevel,
        comments: input.comments,
        poolStatus: PoolStatus.LOOKING_FOR_TEAM,
      },
    });

    const registration = await tx.registration.create({
      data: {
        registrationType: "INDIVIDUAL",
        submitterEmail: input.submitterEmail,
        submitterName: input.submitterName,
        preferredRole: input.preferredRole.join(", "),
        experienceLevel: input.experienceLevel,
        comments: input.comments,
        poolStatus: PoolStatus.LOOKING_FOR_TEAM,
      },
    });

    return { player, registration };
  });

  await createAuditLog({
    actorUserId,
    action: AuditAction.REGISTER_INDIVIDUAL,
    entityType: "Player",
    entityId: result.player.id,
    after: {
      fullName: input.fullName,
      preferredRole: input.preferredRole,
      experienceLevel: input.experienceLevel,
    },
  });

  sseManager.broadcast({
    type: "registration-created",
    data: { playerId: result.player.id, fullName: input.fullName },
  });

  return result;
}
