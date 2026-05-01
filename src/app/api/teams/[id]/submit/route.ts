export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/business/registration";
import { createAuditLog } from "@/lib/business/audit";
import { MANDATORY_PLAYER_COUNT, MANDATORY_FEMALE_COUNT, EXTRA_PLAYER_LIMIT } from "@/lib/validators";
import { sendTeamSubmittedEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { player: { select: { gender: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (session.user.role === "CAPTAIN" && team.captainUserId !== session.user.id) {
      return NextResponse.json({ error: "You can only submit your own team" }, { status: 403 });
    }

    if (team.status !== "INCOMPLETE") {
      return NextResponse.json(
        { error: `Cannot submit team with status ${team.status}` },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const mandatoryCount = settings.mandatoryPlayerCount ?? MANDATORY_PLAYER_COUNT;
    const mandatoryFemale = settings.mandatoryFemaleCount ?? MANDATORY_FEMALE_COUNT;
    const extraLimit = settings.extraPlayerLimit ?? EXTRA_PLAYER_LIMIT;

    const memberCount = team.memberships.length;
    const femaleCount = team.memberships.filter((m) => m.player.gender === "FEMALE").length;

    const reasons = [];

    if (memberCount < mandatoryCount) {
      reasons.push(`Need at least ${mandatoryCount} mandatory players (have ${memberCount})`);
    }

    if (femaleCount < mandatoryFemale) {
      reasons.push(`Need at least ${mandatoryFemale} female player(s) among mandatory players (have ${femaleCount})`);
    }

    const maxAllowed = mandatoryCount + extraLimit;
    if (memberCount > maxAllowed) {
      reasons.push(`Maximum ${maxAllowed} players allowed (${mandatoryCount} mandatory + ${extraLimit} extra), have ${memberCount}`);
    }

    if (memberCount > mandatoryCount) {
      const extraMembers = team.memberships.slice(mandatoryCount);
      const extraMales = extraMembers.filter((m) => m.player.gender === "MALE").length;
      if (extraMales > 1) reasons.push(`Extra players can have at most 1 male (have ${extraMales})`);
    }

    if (reasons.length > 0) {
      return NextResponse.json(
        { error: `Team does not meet criteria: ${reasons.join(". ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: { status: "COMPLETE" },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "MARK_COMPLETE",
      entityType: "Team",
      entityId: team.id,
      before: { status: team.status },
      after: { status: "COMPLETE" },
    });

    const allEmails = team.memberships.map((m) => m.player.email).filter(Boolean) as string[];
    if (allEmails.length > 0) {
      sendTeamSubmittedEmail(allEmails, team.name, memberCount, femaleCount);
    }

    notifyAllAdmins({
      title: "Team Submitted for Approval",
      message: `Team "${team.name}" (${memberCount} players, ${femaleCount} female) submitted for review.`,
      link: "/manage",
    }).catch(() => {});

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Submit team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
