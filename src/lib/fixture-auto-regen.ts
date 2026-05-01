import { prisma } from "@/lib/prisma";
import {
  generateCricketFixtures,
  generateAllPickleballFixtures,
  type TeamSlot,
  type PbEntrySlot,
} from "@/lib/fixture-generator";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function autoRegenerateCricketFixture() {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { sport: "CRICKET" },
    });
    if (!fixture || fixture.status === "FROZEN") return;

    const settings = await prisma.tournamentSettings.findFirst();
    const targetTeams = settings?.targetCricketTeams ?? 12;
    const groupCount = fixture.groupCount ?? settings?.cricketGroupCount ?? 4;

    const teams = await prisma.team.findMany({
      where: { status: "READY" },
      orderBy: { createdAt: "asc" },
    });
    const slots: TeamSlot[] = shuffle(
      teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        captainName: t.captainName,
      }))
    );

    const matches = generateCricketFixtures(slots, targetTeams, groupCount);

    await prisma.match.deleteMany({ where: { fixtureId: fixture.id } });
    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches.map((m) => ({
          fixtureId: fixture.id,
          sport: "CRICKET" as const,
          stage: m.stage,
          groupName: m.groupName ?? null,
          roundNumber: m.roundNumber,
          matchNumber: m.matchNumber,
          category: m.category ?? null,
          team1Id: m.team1Id ?? null,
          team2Id: m.team2Id ?? null,
          entry1Id: m.entry1Id ?? null,
          entry2Id: m.entry2Id ?? null,
          winnerId: m.winnerId ?? null,
          status: m.status ?? "SCHEDULED",
        })),
      });
    }
    await prisma.fixture.update({
      where: { id: fixture.id },
      data: { updatedAt: new Date() },
    });

    console.log(
      `[auto-regen] Cricket fixture regenerated with ${teams.length} teams, ${matches.length} matches`
    );
  } catch (err) {
    console.error("[auto-regen] Cricket fixture error:", err);
  }
}

export async function autoRegeneratePickleballFixture() {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { sport: "PICKLEBALL" },
    });
    if (!fixture || fixture.status === "FROZEN") return;
    if ((fixture.frozenCategories || []).length > 0) return;

    const regs = await prisma.pickleballRegistration.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    });

    const byCategory: Record<string, PbEntrySlot[]> = {};
    for (const r of regs) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push({
        id: r.id,
        player1Name: r.player1Name,
        player2Name: r.player2Name,
        category: r.category,
      });
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat] = shuffle(byCategory[cat]);
    }

    const matches = generateAllPickleballFixtures(byCategory);

    await prisma.match.deleteMany({ where: { fixtureId: fixture.id } });
    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches.map((m) => ({
          fixtureId: fixture.id,
          sport: "PICKLEBALL" as const,
          stage: m.stage,
          groupName: m.groupName ?? null,
          roundNumber: m.roundNumber,
          matchNumber: m.matchNumber,
          category: m.category ?? null,
          team1Id: m.team1Id ?? null,
          team2Id: m.team2Id ?? null,
          entry1Id: m.entry1Id ?? null,
          entry2Id: m.entry2Id ?? null,
          winnerId: m.winnerId ?? null,
          status: m.status ?? "SCHEDULED",
        })),
      });
    }
    await prisma.fixture.update({
      where: { id: fixture.id },
      data: { updatedAt: new Date() },
    });

    console.log(
      `[auto-regen] Pickleball fixture regenerated with ${regs.length} entries, ${matches.length} matches`
    );
  } catch (err) {
    console.error("[auto-regen] Pickleball fixture error:", err);
  }
}
