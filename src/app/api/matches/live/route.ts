import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fixtures = await prisma.fixture.findMany({
      select: { id: true, sport: true, status: true, frozenCategories: true },
    });

    const cricketFixture = fixtures.find((f) => f.sport === "CRICKET" && f.status === "FROZEN");
    const pbFixture = fixtures.find((f) => f.sport === "PICKLEBALL");
    const frozenPbCats = pbFixture?.frozenCategories || [];

    const frozenFixtureIds: string[] = [];
    if (cricketFixture) frozenFixtureIds.push(cricketFixture.id);
    if (pbFixture && frozenPbCats.length > 0) frozenFixtureIds.push(pbFixture.id);

    if (frozenFixtureIds.length === 0) {
      return NextResponse.json({ live: [], recent: [], upcoming: [] });
    }

    const liveMatches = await prisma.match.findMany({
      where: { status: "LIVE", fixtureId: { in: frozenFixtureIds } },
      orderBy: { matchNumber: "asc" },
      take: 20,
    });

    const completedMatches = await prisma.match.findMany({
      where: {
        status: "COMPLETED",
        fixtureId: { in: frozenFixtureIds },
        winnerId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: "SCHEDULED",
        fixtureId: { in: frozenFixtureIds },
        OR: [
          { team1Id: { not: null }, team2Id: { not: null } },
          { entry1Id: { not: null }, entry2Id: { not: null } },
        ],
      },
      orderBy: { matchNumber: "asc" },
      take: 20,
    });

    const isCatFrozen = (m: { sport: string; category: string | null }) => {
      if (m.sport === "CRICKET") return !!cricketFixture;
      return m.category ? frozenPbCats.includes(m.category) : false;
    };
    const isNotBye = (m: { entry1Id: string | null; entry2Id: string | null; team1Id: string | null; team2Id: string | null }) =>
      (m.entry1Id && m.entry2Id) || (m.team1Id && m.team2Id);

    const filteredLive = liveMatches.filter(isCatFrozen);
    const filteredRecent = completedMatches.filter((m) => isCatFrozen(m) && isNotBye(m)).slice(0, 3);
    const filteredUpcoming = upcomingMatches.filter(isCatFrozen).slice(0, 3);

    const allFiltered = [...filteredLive, ...filteredRecent, ...filteredUpcoming];

    const teamIds = new Set<string>();
    const entryIds = new Set<string>();
    for (const m of allFiltered) {
      if (m.team1Id && !m.team1Id.startsWith("WINNER_")) teamIds.add(m.team1Id);
      if (m.team2Id && !m.team2Id.startsWith("WINNER_")) teamIds.add(m.team2Id);
      if (m.entry1Id && !m.entry1Id.startsWith("WINNER_")) entryIds.add(m.entry1Id);
      if (m.entry2Id && !m.entry2Id.startsWith("WINNER_")) entryIds.add(m.entry2Id);
    }

    const teams = teamIds.size > 0
      ? await prisma.team.findMany({
          where: { id: { in: Array.from(teamIds) } },
          select: { id: true, name: true, color: true },
        })
      : [];

    const entries = entryIds.size > 0
      ? await prisma.pickleballRegistration.findMany({
          where: { id: { in: Array.from(entryIds) } },
          select: { id: true, player1Name: true, player2Name: true },
        })
      : [];

    const teamMap: Record<string, { name: string; color: string | null }> = {};
    for (const t of teams) teamMap[t.id] = { name: t.name, color: t.color };

    const entryMap: Record<string, string> = {};
    for (const e of entries)
      entryMap[e.id] = e.player2Name
        ? `${e.player1Name} / ${e.player2Name}`
        : e.player1Name;

    const format = (matches: typeof liveMatches) =>
      matches.map((m) => ({
        id: m.id,
        sport: m.sport,
        stage: m.stage,
        groupName: m.groupName,
        roundNumber: m.roundNumber,
        matchNumber: m.matchNumber,
        category: m.category,
        status: m.status,
        score1: m.score1,
        score2: m.score2,
        winnerId: m.winnerId,
        scheduledDate: m.scheduledDate,
        venue: m.venue,
        team1: m.team1Id ? (teamMap[m.team1Id] || { name: m.team1Id, color: null }) : null,
        team2: m.team2Id ? (teamMap[m.team2Id] || { name: m.team2Id, color: null }) : null,
        entry1: m.entry1Id ? (entryMap[m.entry1Id] || m.entry1Id) : null,
        entry2: m.entry2Id ? (entryMap[m.entry2Id] || m.entry2Id) : null,
      }));

    return NextResponse.json({
      live: format(filteredLive),
      recent: format(filteredRecent),
      upcoming: format(filteredUpcoming),
    });
  } catch (err) {
    console.error("[matches/live GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
