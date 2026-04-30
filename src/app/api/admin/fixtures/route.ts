import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sport = request.nextUrl.searchParams.get("sport")?.toUpperCase();
    if (!sport || !["CRICKET", "PICKLEBALL"].includes(sport)) {
      return NextResponse.json(
        { error: "sport query param required (CRICKET or PICKLEBALL)" },
        { status: 400 }
      );
    }

    const fixture = await prisma.fixture.findUnique({
      where: { sport: sport as "CRICKET" | "PICKLEBALL" },
      include: { matches: { orderBy: { matchNumber: "asc" } } },
    });

    return NextResponse.json({ fixture });
  } catch (err) {
    console.error("[admin/fixtures GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
