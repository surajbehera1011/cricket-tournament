import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateCricketFixtures,
  generateAllPickleballFixtures,
  type TeamSlot,
  type PbEntrySlot,
} from "@/lib/fixture-generator";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sport, groupCount } = await request.json();
    const sportUpper = (sport || "").toUpperCase();
    if (!["CRICKET", "PICKLEBALL"].includes(sportUpper)) {
      return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
    }

    const existing = await prisma.fixture.findUnique({
      where: { sport: sportUpper },
    });
    if (existing?.status === "FROZEN") {
      return NextResponse.json(
        { error: "Fixture is frozen. Unfreeze first to regenerate." },
        { status: 400 }
      );
    }

    const settings = await prisma.tournamentSettings.findFirst();
    const targetTeams = settings?.targetCricketTeams ?? 12;
    const gCount =
      groupCount ?? existing?.groupCount ?? settings?.cricketGroupCount ?? 4;

    let matches;

    if (sportUpper === "CRICKET") {
      const teams = await prisma.team.findMany({
        where: { status: "READY" },
        orderBy: { createdAt: "asc" },
      });
      const slots: TeamSlot[] = teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        captainName: t.captainName,
      }));
      matches = generateCricketFixtures(slots, targetTeams, gCount);
    } else {
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
      matches = generateAllPickleballFixtures(byCategory);
    }

    if (existing) {
      await prisma.match.deleteMany({ where: { fixtureId: existing.id } });
      await prisma.fixture.update({
        where: { id: existing.id },
        data: { groupCount: gCount, updatedAt: new Date() },
      });
      if (matches.length > 0) {
        await prisma.match.createMany({
          data: matches.map((m) => ({
            fixtureId: existing.id,
            sport: sportUpper as "CRICKET" | "PICKLEBALL",
            stage: m.stage,
            groupName: m.groupName ?? null,
            roundNumber: m.roundNumber,
            matchNumber: m.matchNumber,
            category: m.category ?? null,
            team1Id: m.team1Id ?? null,
            team2Id: m.team2Id ?? null,
            entry1Id: m.entry1Id ?? null,
            entry2Id: m.entry2Id ?? null,
          })),
        });
      }
    } else {
      await prisma.fixture.create({
        data: {
          sport: sportUpper as "CRICKET" | "PICKLEBALL",
          groupCount: gCount,
          matches: {
            create: matches.map((m) => ({
              sport: sportUpper as "CRICKET" | "PICKLEBALL",
              stage: m.stage,
              groupName: m.groupName ?? null,
              roundNumber: m.roundNumber,
              matchNumber: m.matchNumber,
              category: m.category ?? null,
              team1Id: m.team1Id ?? null,
              team2Id: m.team2Id ?? null,
              entry1Id: m.entry1Id ?? null,
              entry2Id: m.entry2Id ?? null,
            })),
          },
        },
      });
    }

    const fixture = await prisma.fixture.findUnique({
      where: { sport: sportUpper as "CRICKET" | "PICKLEBALL" },
      include: { matches: { orderBy: { matchNumber: "asc" } } },
    });

    return NextResponse.json({ fixture, generated: matches.length });
  } catch (err) {
    console.error("[admin/fixtures/generate POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
