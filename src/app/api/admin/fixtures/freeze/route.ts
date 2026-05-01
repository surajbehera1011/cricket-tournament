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

    const { sport, action, category } = await request.json();
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

    if (sportUpper === "CRICKET") {
      if (action === "freeze") {
        await prisma.fixture.update({
          where: { id: fixture.id },
          data: { status: "FROZEN", frozenAt: new Date() },
        });
        return NextResponse.json({ message: "Cricket fixture frozen", status: "FROZEN" });
      } else {
        await prisma.fixture.update({
          where: { id: fixture.id },
          data: { status: "DRAFT", frozenAt: null },
        });
        return NextResponse.json({ message: "Cricket fixture unfrozen", status: "DRAFT" });
      }
    }

    if (!category) {
      return NextResponse.json({ error: "Category required for pickleball" }, { status: 400 });
    }

    const cats = fixture.frozenCategories || [];
    if (action === "freeze") {
      if (!cats.includes(category)) {
        const updated = [...cats, category];
        const allFrozen = updated.length >= 5;
        await prisma.fixture.update({
          where: { id: fixture.id },
          data: {
            frozenCategories: updated,
            status: allFrozen ? "FROZEN" : fixture.status,
            frozenAt: allFrozen ? new Date() : fixture.frozenAt,
          },
        });
      }
      return NextResponse.json({
        message: `${category} frozen`,
        frozenCategories: [...new Set([...cats, category])],
      });
    } else {
      const updated = cats.filter((c: string) => c !== category);
      await prisma.fixture.update({
        where: { id: fixture.id },
        data: {
          frozenCategories: updated,
          status: updated.length === 0 ? "DRAFT" : fixture.status,
        },
      });
      return NextResponse.json({
        message: `${category} unfrozen`,
        frozenCategories: updated,
      });
    }
  } catch (err) {
    console.error("[admin/fixtures/freeze POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
