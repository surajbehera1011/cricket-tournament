export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { z } from "zod";
import { sendIndividualApprovedEmail } from "@/lib/email";

const updatePlayerSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  approve: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updatePlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.gender) {
      updateData.gender = parsed.data.gender;
    }

    if (parsed.data.approve) {
      updateData.poolStatus = PoolStatus.LOOKING_FOR_TEAM;

      await createAuditLog({
        actorUserId: session.user.id,
        action: "APPROVE_INDIVIDUAL",
        entityType: "Player",
        entityId: id,
        before: { poolStatus: "PENDING_APPROVAL" },
        after: { poolStatus: "LOOKING_FOR_TEAM" },
      });
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    if (parsed.data.approve && player.email) {
      sendIndividualApprovedEmail(player.fullName, player.email);
    }

    const membership = await prisma.teamMembership.findFirst({ where: { playerId: id } });

    return NextResponse.json({
      id: player.id,
      gender: player.gender,
      poolStatus: player.poolStatus,
      teamId: membership?.teamId ?? null,
    });
  } catch (error) {
    console.error("Update player error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
