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

  const byRound = new Map<number, typeof categoryMatches>();
  for (const m of categoryMatches) {
    if (!byRound.has(m.roundNumber)) byRound.set(m.roundNumber, []);
    byRound.get(m.roundNumber)!.push(m);
  }
  for (const arr of byRound.values()) {
    arr.sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  for (let ri = 0; ri < rounds.length; ri++) {
    const roundMatches = byRound.get(rounds[ri])!;
    const nextRoundMatches = ri + 1 < rounds.length ? byRound.get(rounds[ri + 1])! : null;

    for (let pos = 0; pos < roundMatches.length; pos++) {
      const m = roundMatches[pos];
      const p1 = isCricket ? m.team1Id : m.entry1Id;
      const p2 = isCricket ? m.team2Id : m.entry2Id;
      const isBye = (p1 && !p2) || (!p1 && p2);
      const hasBoth = p1 && p2;

      if (isBye) {
        const winner = p1 || p2;
        if (m.winnerId !== winner || m.status !== "COMPLETED") {
          await prisma.match.update({
            where: { id: m.id },
            data: { winnerId: winner, status: "COMPLETED" },
          });
          m.winnerId = winner;
          m.status = "COMPLETED";
        }

        if (nextRoundMatches) {
          const nextIdx = Math.floor(pos / 2);
          if (nextIdx < nextRoundMatches.length) {
            const nextMatch = nextRoundMatches[nextIdx];
            const slot = pos % 2 === 0 ? "1" : "2";
            const field = isCricket
              ? (slot === "1" ? "team1Id" : "team2Id")
              : (slot === "1" ? "entry1Id" : "entry2Id");
            const current = (nextMatch as Record<string, unknown>)[field] as string | null;
            if (current !== winner) {
              await prisma.match.update({
                where: { id: nextMatch.id },
                data: { [field]: winner },
              });
              (nextMatch as Record<string, unknown>)[field] = winner;
            }
          }
        }
      } else if (hasBoth) {
        if (m.winnerId && m.status === "COMPLETED") {
          // Real match already played — leave as is
        } else if (m.status === "COMPLETED" && !m.winnerId) {
          await prisma.match.update({
            where: { id: m.id },
            data: { winnerId: null, status: "SCHEDULED" },
          });
          m.status = "SCHEDULED";
          m.winnerId = null;
        }

        if (nextRoundMatches) {
          const nextIdx = Math.floor(pos / 2);
          if (nextIdx < nextRoundMatches.length) {
            const nextMatch = nextRoundMatches[nextIdx];
            const slot = pos % 2 === 0 ? "1" : "2";
            const field = isCricket
              ? (slot === "1" ? "team1Id" : "team2Id")
              : (slot === "1" ? "entry1Id" : "entry2Id");
            const current = (nextMatch as Record<string, unknown>)[field] as string | null;
            const expected = `WINNER_M${m.matchNumber}`;
            if (current !== expected && !(m.winnerId && current === m.winnerId)) {
              await prisma.match.update({
                where: { id: nextMatch.id },
                data: { [field]: expected },
              });
              (nextMatch as Record<string, unknown>)[field] = expected;
            }
          }
        }
      }
    }
  }
}
