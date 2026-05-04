export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/business/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { teamId, newName } = await request.json();

    if (!teamId || !newName?.trim()) {
      return NextResponse.json({ error: "Team ID and new name are required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const oldName = team.name;
    const trimmedName = newName.trim();

    await prisma.team.update({ where: { id: teamId }, data: { name: trimmedName } });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "RENAME_TEAM",
      entityType: "Team",
      entityId: teamId,
      before: { name: oldName },
      after: { name: trimmedName },
    });

    return NextResponse.json({ message: "Team renamed", name: trimmedName });
  } catch (error) {
    console.error("Rename team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
