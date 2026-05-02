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

    const { matchId, score1, score2 } = await request.json();

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { fixture: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "LIVE") {
      return NextResponse.json(
        { error: "Can only update scores on LIVE matches" },
        { status: 400 }
      );
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        score1: score1 || null,
        score2: score2 || null,
      },
    });

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("[admin/fixtures/live-score POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
