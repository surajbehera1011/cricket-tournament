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

    const { sport, matchId1, matchId2, slot1, slot2 } = await request.json();
    const sportUpper = (sport || "").toUpperCase();

    if (!matchId1 || !matchId2 || !slot1 || !slot2) {
      return NextResponse.json(
        { error: "matchId1, matchId2, slot1, slot2 required" },
        { status: 400 }
      );
    }

    const match1 = await prisma.match.findUnique({ where: { id: matchId1 } });
    const match2 = await prisma.match.findUnique({ where: { id: matchId2 } });
    if (!match1 || !match2) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const isCricket = sportUpper === "CRICKET";
    const field1 = isCricket
      ? slot1 === "1" ? "team1Id" : "team2Id"
      : slot1 === "1" ? "entry1Id" : "entry2Id";
    const field2 = isCricket
      ? slot2 === "1" ? "team1Id" : "team2Id"
      : slot2 === "1" ? "entry1Id" : "entry2Id";

    const val1 = (match1 as Record<string, unknown>)[field1] as string | null;
    const val2 = (match2 as Record<string, unknown>)[field2] as string | null;

    await prisma.match.update({
      where: { id: matchId1 },
      data: { [field1]: val2 },
    });
    await prisma.match.update({
      where: { id: matchId2 },
      data: { [field2]: val1 },
    });

    return NextResponse.json({ message: "Swapped" });
  } catch (err) {
    console.error("[admin/fixtures/swap POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
