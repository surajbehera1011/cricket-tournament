import { prisma } from "@/lib/prisma";
import { TeamStatus, PoolStatus, MembershipType, AuditAction, Prisma, Gender } from "@prisma/client";
import { createAuditLog } from "./audit";
import { sseManager } from "@/lib/sse";
import type { TeamRegistrationInput, IndividualRegistrationInput } from "@/lib/validators";

export async function getSettings() {
  let settings = await prisma.tournamentSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.tournamentSettings.create({ data: { id: "singleton" } });
  }
  return settings;
}

export async function recomputeTeamStatus(teamId: string): Promise<TeamStatus> {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: { memberships: { include: { player: { select: { gender: true } } } } },
  });

  if (team.status === "READY" || team.status === "PENDING_APPROVAL") return team.status;

  const settings = await getSettings();
  const memberCount = team.memberships.length;
  const femaleCount = team.memberships.filter((m) => m.player.gender === "FEMALE").length;
  const sizeOk = memberCount >= settings.maxTeamSize;
  const femaleOk = femaleCount >= settings.minFemalePerTeam;
  const newStatus = sizeOk && femaleOk ? TeamStatus.COMPLETE : TeamStatus.INCOMPLETE;

  if (team.status !== newStatus) {
    await prisma.team.update({ where: { id: teamId }, data: { status: newStatus } });
  }
  return newStatus;
}

export async function registerTeam(input: TeamRegistrationInput) {
  const settings = await getSettings();
  const teamSize = settings.maxTeamSize;

  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.upsert({
      where: { name: input.teamName },
      update: { teamSize, captainName: input.captainName },
      create: {
        name: input.teamName,
        captainName: input.captainName,
        teamSize,
        status: TeamStatus.PENDING_APPROVAL,
      },
    });

    const players = [];

    const captainPlayer = await tx.player.create({
      data: {
        fullName: input.captainName,
        email: input.captainEmail,
        gender: input.captainGender as Gender,
        preferredRole: "",
        experienceLevel: "",
        poolStatus: PoolStatus.ASSIGNED,
      },
    });
    players.push(captainPlayer);
    await tx.teamMembership.create({
      data: {
        teamId: team.id,
        playerId: captainPlayer.id,
        membershipType: MembershipType.TEAM_SUBMISSION,
        positionSlot: "Captain",
      },
    });

    for (let i = 0; i < input.players.length; i++) {
      const entry = input.players[i];
      const player = await tx.player.create({
        data: {
          fullName: entry.name,
          email: entry.email,
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
          positionSlot: `Player ${i + 2}`,
        },
      });
    }

    const allPlayersJson = [
      { slot: "Captain", name: input.captainName, gender: input.captainGender, email: input.captainEmail },
      ...input.players.map((p, idx) => ({
        slot: `Player ${idx + 2}`,
        name: p.name,
        gender: p.gender,
        email: p.email,
      })),
    ];

    await tx.registration.create({
      data: {
        registrationType: "TEAM",
        submitterEmail: input.submitterEmail,
        submitterName: input.submitterName,
        teamName: input.teamName,
        captainName: input.captainName,
        teamSize,
        teamPlayersJson: allPlayersJson as unknown as Prisma.InputJsonValue,
        comments: input.comments,
        poolStatus: PoolStatus.NONE,
      },
    });

    return { team, players };
  });

  sseManager.broadcast({
    type: "registration-created",
    data: { teamId: result.team.id, teamName: input.teamName },
  });

  return result;
}

export async function registerIndividual(input: IndividualRegistrationInput) {
  const result = await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: {
        fullName: input.fullName,
        email: input.email || null,
        gender: input.gender as Gender,
        preferredRole: input.preferredRole.join(", "),
        experienceLevel: input.experienceLevel,
        comments: input.comments,
        poolStatus: PoolStatus.PENDING_APPROVAL,
      },
    });

    await tx.registration.create({
      data: {
        registrationType: "INDIVIDUAL",
        submitterEmail: input.submitterEmail || "",
        submitterName: input.fullName,
        preferredRole: input.preferredRole.join(", "),
        experienceLevel: input.experienceLevel,
        comments: input.comments,
        poolStatus: PoolStatus.PENDING_APPROVAL,
      },
    });

    return { player };
  });

  sseManager.broadcast({
    type: "registration-created",
    data: { playerId: result.player.id, fullName: input.fullName },
  });

  return result;
}
