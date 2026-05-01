import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAllAdmins } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchId, score1, score2, winnerId } = await request.json();

    if (!matchId || !winnerId) {
      return NextResponse.json(
        { error: "matchId and winnerId are required" },
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

    if (match.fixture.sport === "CRICKET" && match.fixture.status !== "FROZEN") {
      return NextResponse.json(
        { error: "Cricket fixture must be frozen to record scores" },
        { status: 400 }
      );
    }

    if (match.fixture.sport === "PICKLEBALL") {
      const frozen = match.fixture.frozenCategories || [];
      if (!match.category || !frozen.includes(match.category)) {
        return NextResponse.json(
          { error: `Category ${match.category || "unknown"} is not frozen. Freeze it first to record scores.` },
          { status: 400 }
        );
      }
    }

    const participant1 = match.team1Id || match.entry1Id;
    const participant2 = match.team2Id || match.entry2Id;

    if (winnerId !== participant1 && winnerId !== participant2) {
      return NextResponse.json(
        { error: "winnerId must be one of the match participants" },
        { status: 400 }
      );
    }

    const before = {
      score1: match.score1,
      score2: match.score2,
      winnerId: match.winnerId,
      status: match.status,
    };

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        score1: score1 || null,
        score2: score2 || null,
        winnerId,
        status: "COMPLETED",
      },
    });

    // Advance winner to next round
    await advanceWinner(match, winnerId);

    // Audit log (non-blocking)
    try {
      if (session.user.id) {
        await prisma.auditLog.create({
          data: {
            actorUserId: session.user.id,
            action: "RECORD_SCORE",
            entityType: "Match",
            entityId: matchId,
            before,
            after: {
              score1: updated.score1,
              score2: updated.score2,
              winnerId: updated.winnerId,
              status: updated.status,
            },
          },
        });
      }
    } catch (auditErr) {
      console.error("Audit log failed (non-blocking):", auditErr);
    }

    notifyAllAdmins({
      title: "Match Score Recorded",
      message: `Score recorded: ${updated.score1 || "?"} - ${updated.score2 || "?"} (Match #${updated.matchNumber}, R${updated.roundNumber}).`,
      link: "/admin/fixtures",
    }).catch(() => {});

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("[admin/fixtures/score POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function advanceWinner(
  match: {
    id: string;
    fixtureId: string;
    sport: string;
    stage: string;
    groupName: string | null;
    roundNumber: number;
    matchNumber: number;
    category: string | null;
    team1Id: string | null;
    team2Id: string | null;
    entry1Id: string | null;
    entry2Id: string | null;
  },
  winnerId: string
) {
  const isCricket = match.sport === "CRICKET";
  const allMatches = await prisma.match.findMany({
    where: { fixtureId: match.fixtureId },
    orderBy: { matchNumber: "asc" },
  });

  if (match.stage === "GROUP") {
    await tryAdvanceGroupWinnersToKnockout(allMatches, match, isCricket);
    return;
  }

  // For knockout matches, find the next round match that references this match's winner
  const winnerRef = `WINNER_M${match.matchNumber}`;
  const nextMatch = allMatches.find((m) => {
    if (isCricket) {
      return m.team1Id === winnerRef || m.team2Id === winnerRef;
    }
    return m.entry1Id === winnerRef || m.entry2Id === winnerRef;
  });

  if (!nextMatch) return;

  const updateData: Record<string, string> = {};
  if (isCricket) {
    if (nextMatch.team1Id === winnerRef) updateData.team1Id = winnerId;
    if (nextMatch.team2Id === winnerRef) updateData.team2Id = winnerId;
  } else {
    if (nextMatch.entry1Id === winnerRef) updateData.entry1Id = winnerId;
    if (nextMatch.entry2Id === winnerRef) updateData.entry2Id = winnerId;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: updateData,
    });
  }
}

async function tryAdvanceGroupWinnersToKnockout(
  allMatches: {
    id: string;
    stage: string;
    groupName: string | null;
    status: string;
    winnerId: string | null;
    team1Id: string | null;
    team2Id: string | null;
    entry1Id: string | null;
    entry2Id: string | null;
    roundNumber: number;
    matchNumber: number;
    category: string | null;
  }[],
  completedMatch: { groupName: string | null },
  isCricket: boolean
) {
  if (!completedMatch.groupName) return;

  const groupMatches = allMatches.filter(
    (m) => m.stage === "GROUP" && m.groupName === completedMatch.groupName
  );
  const allGroupDone = groupMatches.every((m) => m.status === "COMPLETED" || m.winnerId);

  if (!allGroupDone) return;

  // Calculate standings for this group
  const standings = calculateGroupStandings(groupMatches, isCricket);
  if (standings.length === 0) return;

  const groupWinner = standings[0].id;
  const knockoutMatches = allMatches.filter((m) => m.stage === "KNOCKOUT");

  const winnerPlaceholder = `WINNER_${completedMatch.groupName}`;

  for (const km of knockoutMatches) {
    const updateData: Record<string, string> = {};
    if (isCricket) {
      if (km.team1Id === winnerPlaceholder) updateData.team1Id = groupWinner;
      if (km.team2Id === winnerPlaceholder) updateData.team2Id = groupWinner;
    } else {
      if (km.entry1Id === winnerPlaceholder) updateData.entry1Id = groupWinner;
      if (km.entry2Id === winnerPlaceholder) updateData.entry2Id = groupWinner;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.match.update({
        where: { id: km.id },
        data: updateData,
      });
    }
  }
}

interface StandingEntry {
  id: string;
  played: number;
  won: number;
  lost: number;
  points: number;
}

function calculateGroupStandings(
  groupMatches: {
    winnerId: string | null;
    team1Id: string | null;
    team2Id: string | null;
    entry1Id: string | null;
    entry2Id: string | null;
    status: string;
  }[],
  isCricket: boolean
): StandingEntry[] {
  const map = new Map<string, StandingEntry>();

  const getOrCreate = (id: string): StandingEntry => {
    if (!map.has(id)) {
      map.set(id, { id, played: 0, won: 0, lost: 0, points: 0 });
    }
    return map.get(id)!;
  };

  for (const m of groupMatches) {
    const p1 = isCricket ? m.team1Id : m.entry1Id;
    const p2 = isCricket ? m.team2Id : m.entry2Id;
    if (!p1 || !p2) continue;

    const s1 = getOrCreate(p1);
    const s2 = getOrCreate(p2);

    if (m.winnerId) {
      s1.played++;
      s2.played++;

      if (m.winnerId === p1) {
        s1.won++;
        s1.points += 2;
        s2.lost++;
      } else if (m.winnerId === p2) {
        s2.won++;
        s2.points += 2;
        s1.lost++;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return a.lost - b.lost;
  });
}

// calculateGroupStandings is also used in the score route
