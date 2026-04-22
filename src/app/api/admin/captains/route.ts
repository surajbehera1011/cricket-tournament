export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { jsonResponse } from "@/lib/api-utils";
import { z } from "zod";

const createCaptainSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  teamId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const captains = await prisma.user.findMany({
      where: { role: UserRole.CAPTAIN },
      include: {
        captainOfTeams: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(
      captains.map((c) => ({
        id: c.id,
        email: c.email,
        displayName: c.displayName,
        teams: c.captainOfTeams,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get captains error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCaptainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const captain = await prisma.user.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        password: parsed.data.password,
        role: UserRole.CAPTAIN,
      },
    });

    if (parsed.data.teamId) {
      await prisma.team.update({
        where: { id: parsed.data.teamId },
        data: { captainUserId: captain.id },
      });
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "CREATE_CAPTAIN",
      entityType: "User",
      entityId: captain.id,
      after: { email: captain.email, displayName: captain.displayName, teamId: parsed.data.teamId },
    });

    return NextResponse.json(
      { id: captain.id, email: captain.email, displayName: captain.displayName },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create captain error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
