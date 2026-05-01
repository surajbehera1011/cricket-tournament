import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchId, live } = await request.json();

    if (!matchId || typeof live !== "boolean") {
      return NextResponse.json(
        { error: "matchId (string) and live (boolean) are required" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot change live status of a completed match" },
        { status: 400 }
      );
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: live ? "LIVE" : "SCHEDULED" },
    });

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("[admin/fixtures/live POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
