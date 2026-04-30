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

    const { sport, action } = await request.json();
    const sportUpper = (sport || "").toUpperCase();
    if (!["CRICKET", "PICKLEBALL"].includes(sportUpper)) {
      return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
    }
    if (!["freeze", "unfreeze"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const fixture = await prisma.fixture.findUnique({
      where: { sport: sportUpper as "CRICKET" | "PICKLEBALL" },
    });
    if (!fixture) {
      return NextResponse.json(
        { error: "No fixture found. Generate first." },
        { status: 404 }
      );
    }

    if (action === "freeze") {
      await prisma.fixture.update({
        where: { id: fixture.id },
        data: { status: "FROZEN", frozenAt: new Date() },
      });
      return NextResponse.json({ message: "Fixture frozen", status: "FROZEN" });
    } else {
      await prisma.fixture.update({
        where: { id: fixture.id },
        data: { status: "DRAFT", frozenAt: null },
      });
      return NextResponse.json({ message: "Fixture unfrozen", status: "DRAFT" });
    }
  } catch (err) {
    console.error("[admin/fixtures/freeze POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
