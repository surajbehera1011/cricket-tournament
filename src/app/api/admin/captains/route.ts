export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, TeamStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/business/audit";
import { jsonResponse } from "@/lib/api-utils";
import { z } from "zod";

const createCaptainSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  teamId: z.string().uuid().optional(),
});

const updateCaptainSchema = z.object({
  captainId: z.string().uuid(),
  email: z.string().email().optional(),
  displayName: z.string().min(2).max(100).optional(),
  password: z.string().min(6).optional(),
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

    const teamsWithoutLogin = await prisma.team.findMany({
      where: {
        captainUserId: null,
        status: { not: TeamStatus.PENDING_APPROVAL },
      },
      select: {
        id: true,
        name: true,
        captainName: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse({
      captains: captains.map((c) => ({
        id: c.id,
        email: c.email,
        displayName: c.displayName,
        teams: c.captainOfTeams,
        createdAt: c.createdAt,
      })),
      teamsWithoutLogin: teamsWithoutLogin.map((t) => ({
        id: t.id,
        name: t.name,
        captainName: t.captainName,
        status: t.status,
      })),
    });
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCaptainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const captain = await prisma.user.findUnique({ where: { id: parsed.data.captainId } });
    if (!captain || captain.role !== UserRole.CAPTAIN) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    const updateData: Record<string, string> = {};
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.displayName) updateData.displayName = parsed.data.displayName;
    if (parsed.data.password) updateData.password = parsed.data.password;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (parsed.data.email && parsed.data.email !== captain.email) {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: parsed.data.captainId },
      data: updateData,
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "UPDATE_CAPTAIN",
      entityType: "User",
      entityId: updated.id,
      after: { email: updated.email, displayName: updated.displayName, passwordChanged: !!parsed.data.password },
    });

    return NextResponse.json({ id: updated.id, email: updated.email, displayName: updated.displayName });
  } catch (error) {
    console.error("Update captain error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
