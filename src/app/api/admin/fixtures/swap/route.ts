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

    await recalcByeAdvancements(match1.fixtureId, isCricket, match1.category);

    return NextResponse.json({ message: "Swapped" });
  } catch (err) {
    console.error("[admin/fixtures/swap POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function recalcByeAdvancements(fixtureId: string, isCricket: boolean, category: string | null) {
  const allMatches = await prisma.match.findMany({
    where: { fixtureId },
    orderBy: { matchNumber: "asc" },
  });

  const categoryMatches = category
    ? allMatches.filter((m) => m.category === category)
    : allMatches.filter((m) => m.stage === "KNOCKOUT");

  for (const m of categoryMatches) {
    const p1 = isCricket ? m.team1Id : m.entry1Id;
    const p2 = isCricket ? m.team2Id : m.entry2Id;
    const isBye = (p1 && !p2) || (!p1 && p2);

    if (isBye) {
      const newWinner = p1 || p2;
      const oldWinner = m.winnerId;

      if (oldWinner !== newWinner) {
        await prisma.match.update({
          where: { id: m.id },
          data: { winnerId: newWinner, status: "COMPLETED" },
        });

        if (oldWinner) {
          const winnerRef = `WINNER_M${m.matchNumber}`;
          for (const dm of categoryMatches) {
            if (dm.id === m.id || dm.roundNumber <= m.roundNumber) continue;
            const updateData: Record<string, string> = {};
            if (isCricket) {
              if (dm.team1Id === oldWinner || dm.team1Id === winnerRef) updateData.team1Id = newWinner!;
              if (dm.team2Id === oldWinner || dm.team2Id === winnerRef) updateData.team2Id = newWinner!;
            } else {
              if (dm.entry1Id === oldWinner || dm.entry1Id === winnerRef) updateData.entry1Id = newWinner!;
              if (dm.entry2Id === oldWinner || dm.entry2Id === winnerRef) updateData.entry2Id = newWinner!;
            }
            if (Object.keys(updateData).length > 0) {
              await prisma.match.update({
                where: { id: dm.id },
                data: updateData,
              });
              const dmIdx = categoryMatches.findIndex((x) => x.id === dm.id);
              if (dmIdx >= 0) Object.assign(categoryMatches[dmIdx], updateData);
            }
          }
        }
      }
    } else if (!p1 && !p2) {
      if (m.winnerId || m.status === "COMPLETED") {
        await prisma.match.update({
          where: { id: m.id },
          data: { winnerId: null, status: "SCHEDULED" },
        });
      }
    }
  }
}
