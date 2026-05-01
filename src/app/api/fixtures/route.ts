import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sport = request.nextUrl.searchParams.get("sport")?.toUpperCase();
    if (!sport || !["CRICKET", "PICKLEBALL"].includes(sport)) {
      return NextResponse.json(
        { error: "sport query param required" },
        { status: 400 }
      );
    }

    const fixture = await prisma.fixture.findUnique({
      where: { sport: sport as "CRICKET" | "PICKLEBALL" },
      include: { matches: { orderBy: { matchNumber: "asc" } } },
    });

    if (!fixture) {
      return NextResponse.json({ fixture: null, frozen: false });
    }

    const teams =
      sport === "CRICKET"
        ? await prisma.team.findMany({
            where: { status: "READY" },
            select: { id: true, name: true, color: true, captainName: true },
          })
        : [];

    const pbRegs =
      sport === "PICKLEBALL"
        ? await prisma.pickleballRegistration.findMany({
            where: { status: "APPROVED" },
            select: {
              id: true,
              player1Name: true,
              player2Name: true,
              player1Email: true,
              category: true,
            },
          })
        : [];

    const settings = await prisma.tournamentSettings.findFirst();

    return NextResponse.json({
      fixture,
      frozen: fixture.status === "FROZEN" || (fixture.frozenCategories || []).length > 0,
      frozenCategories: fixture.frozenCategories || [],
      teams,
      pbRegs,
      settings: {
        targetCricketTeams: settings?.targetCricketTeams ?? 12,
        cricketGroupCount: settings?.cricketGroupCount ?? 4,
      },
    });
  } catch (err) {
    console.error("[fixtures GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
