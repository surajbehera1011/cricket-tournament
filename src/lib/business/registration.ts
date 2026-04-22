import { prisma } from "@/lib/prisma";
import { TeamStatus, PoolStatus, MembershipType, AuditAction, Prisma, Gender } from "@prisma/client";
import { createAuditLog } from "./audit";
import { sseManager } from "@/lib/sse";
import type { TeamRegistrationInput, IndividualRegistrationInput } from "@/lib/validators";

export async function getSettings() {
  let settings = await prisma.tournamentSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.tournamentSettings.create({
      data: { id: "singleton" },
    });
  }
  return settings;
}

export async function recomputeTeamStatus(teamId: string): Promise<TeamStatus> {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: {
      memberships: {
        include: { player: { select: { gender: true } } },
      },
    },
  });

  const settings = await getSettings();

  const memberCount = team.memberships.length;
  const femaleCount = team.memberships.filter(
    (m) => m.player.gender === "FEMALE"
  ).length;

  const sizeOk = memberCount >= settings.maxTeamSize;
  const femaleOk = femaleCount >= settings.minFemalePerTeam;
  const newStatus = sizeOk && femaleOk ? TeamStatus.COMPLETE : TeamStatus.INCOMPLETE;

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
  const settings = await getSettings();
  const teamSize = settings.maxTeamSize;

  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.upsert({
      where: { name: input.teamName },
      update: { teamSize },
      create: {
        name: input.teamName,
        teamSize,
        status: TeamStatus.INCOMPLETE,
      },
    });

    const players = [];
    for (let i = 0; i < input.players.length; i++) {
      const entry = input.players[i];
      const player = await tx.player.create({
        data: {
          fullName: entry.name,
          gender: entry.gender as Gender,
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
        teamSize,
        teamPlayersJson: input.players.map((p, idx) => ({
          slot: `Player ${idx + 1}`,
          name: p.name,
          gender: p.gender,
        })) as unknown as Prisma.InputJsonValue,
        comments: input.comments,
        poolStatus: PoolStatus.NONE,
      },
    });

    return { team, players, registration };
  });

  await recomputeTeamStatus(result.team.id);

  await createAuditLog({
    actorUserId,
    action: AuditAction.REGISTER_TEAM,
    entityType: "Team",
    entityId: result.team.id,
    after: {
      teamName: input.teamName,
      captainName: input.captainName,
      teamSize,
      playerCount: input.players.length,
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
        gender: input.gender as Gender,
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
      gender: input.gender,
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
