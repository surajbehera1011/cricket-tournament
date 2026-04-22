export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/business/audit";
import { recomputeTeamStatus } from "@/lib/business/registration";
import { jsonResponse } from "@/lib/api-utils";

const updateSettingsSchema = z.object({
  maxTeamSize: z.number().int().min(2).max(20).optional(),
  minFemalePerTeam: z.number().int().min(0).max(10).optional(),
  tournamentName: z.string().min(1).max(200).optional(),
  registrationOpen: z.boolean().optional(),
  tournamentStartDate: z.string().nullable().optional(),
});

export async function GET() {
  try {
    let settings = await prisma.tournamentSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.tournamentSettings.create({
        data: { id: "singleton" },
      });
    }

    return jsonResponse(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const before = await prisma.tournamentSettings.findUnique({
      where: { id: "singleton" },
    });

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.tournamentStartDate !== undefined) {
      updateData.tournamentStartDate = parsed.data.tournamentStartDate
        ? new Date(parsed.data.tournamentStartDate)
        : null;
    }

    const settings = await prisma.tournamentSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: { id: "singleton", ...updateData },
    });

    if (parsed.data.maxTeamSize !== undefined) {
      await prisma.team.updateMany({
        data: { teamSize: parsed.data.maxTeamSize },
      });
    }

    const allTeams = await prisma.team.findMany({ select: { id: true } });
    for (const team of allTeams) {
      await recomputeTeamStatus(team.id);
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "UPDATE_SETTINGS",
      entityType: "TournamentSettings",
      entityId: "singleton",
      before: before as unknown as Record<string, unknown>,
      after: settings as unknown as Record<string, unknown>,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
