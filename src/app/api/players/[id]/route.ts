export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePlayerSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "CAPTAIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updatePlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const player = await prisma.player.update({
      where: { id: params.id },
      data: { gender: parsed.data.gender },
    });

    const membership = await prisma.teamMembership.findFirst({
      where: { playerId: params.id },
    });

    return NextResponse.json({
      id: player.id,
      gender: player.gender,
      teamId: membership?.teamId ?? null,
    });
  } catch (error) {
    console.error("Update player error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
